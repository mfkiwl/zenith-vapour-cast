'use client'
import Image from "next/image";
import { act, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import Header from "../components/Header";

import { Montserrat } from "next/font/google";
const mont = Montserrat({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'] });


// Add these interfaces at the top of your file
interface ExtractedData {
  stationId: string;
  stationLatitude: number;
  stationLongitude: number;
  stationElevation: number;
  timestamp: number;
  zwdObservation: string;
  satelliteAzimuth: number;
  satelliteElevation: number;
  totalObservations: number;
  temperature?: number;
  pressure?: number;
  humidity?: number;
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  dateString?: string;
}

interface PredictionResult {
  predicted_pw: string | number;
  uncertainty: number;
  method: string;
  note?: string;
  error?: string;
  station_id?: string;
  timestamp?: string;
}

interface FileInfo {
  originalName: string;
  stationId: string;
  processedAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  extractedData: ExtractedData;
  prediction: PredictionResult;
  fileInfo: FileInfo;
}


export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const div1Ref = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState('');
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [sliderStyle, setSliderStyle] = useState({left: 0, width: 0});
  const containerRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<ApiResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [includeMeteoData, setIncludeMeteoData] = useState(true);
  const [processAllSatellites, setProcessAllSatellites] = useState(false);
  
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isProcessingInterpolation, setIsProcessingInterpolation] = useState(false);
  const [interpolationResult, setInterpolationResult] = useState<any>(null);

  const {ref: div1Ref2, inView: div1Ref2InView} = useInView({
    triggerOnce: false, 
    threshold: 0.3,
  });
  
  const [offsetY, setOffsetY] = useState(0);
  
  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setOffsetY(scrollY * 0.27);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateSlider = () => {
      const el = tabRefs.current[activeTab];
      const container = containerRef.current;

      if (el && container) {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setSliderStyle({
          left: elRect.left - containerRect.left,
          width: elRect.width,
        });
      }
    };

    updateSlider();
    window.addEventListener('resize', updateSlider);

    return () => window.removeEventListener('resize', updateSlider);
  }, [activeTab]);

  const { user, token, isLoggedIn, loading: authLoading, logout } = useAuth();
  const loading = authLoading || status === "loading";
  const isUserLoggedIn = isLoggedIn || status === "authenticated";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.Z')) {
      setFile(selectedFile);
      setErrorMessage("");
    } else {
      setFile(null);
      setErrorMessage("Please select a valid .Z file");
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {el.scrollIntoView({ behavior: 'smooth' });}
  };


  const handleByRinex = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProcessingProgress(10);
      setErrorMessage("");
      setResult(null);

      const reqToken = token || session?.accessToken;
      const formData = new FormData();
      formData.append("rinexFile", file);
      formData.append("includeMeteoData", includeMeteoData.toString());
      formData.append("processAllSatellites", processAllSatellites.toString());

      const response = await fetch("http://localhost:3001/api/pw/by/rinex", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${reqToken}`,
        },
        body: formData,
      });

      setProcessingProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to process RINEX file");
      }

      const result: ApiResponse = await response.json();
      console.log("Backend result:", result);
      
      setProcessingProgress(100);
      setResult(result);
      
      setTimeout(() => {
        setProcessingProgress(0);
        setIsProcessing(false);
        scrollToSection('result');
      }, 1000);
      
    } catch (error: any) {
      console.error("Error handling RINEX:", error);
      setErrorMessage(error.message || "Error uploading file");
      setProcessingProgress(0);
      setIsProcessing(false);
    }
  };

  const handleInterpolation = async () => {
  if (!latitude || !longitude) return;

  try {
    setIsProcessingInterpolation(true);
    setInterpolationResult(null);

    const reqToken = token || session?.accessToken;
    
    console.log('Sending interpolation request:', { latitude, longitude });
    
    const response = await fetch("http://localhost:3001/api/pw/by/interpolation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${reqToken}`,
      },
      body: JSON.stringify({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error text:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Unknown error' };
      }
      
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Interpolation result:", result);
    setInterpolationResult(result);
    
  } catch (error: any) {
    console.error("Error handling interpolation:", error);
    setErrorMessage(error.message || "Error getting interpolated PW");
    
    // Show error to user
    alert(`Error: ${error.message || "Failed to get interpolated PW"}`);
  } finally {
    setIsProcessingInterpolation(false);
  }
};

  if (loading) {
    return <Loading />;
  }
  
  if (!isUserLoggedIn) {
    return (
      <div className="z-2 relative h-[100vh] w-screen flex flex-col items-center justify-center">
        <Image className="z-1 object-cover object-center" src={`/landingpage_harvestborder/2.png`} alt="" fill/>
        <div className={`${mont.className} relative h-[77%] w-[77%] rounded-xl flex items-center justify-center`}>
          <img src={`/bg_noise/white.png`} alt="" className="absolute z-2 w-full h-full rounded-xl object-cover opacity-[0.81]"/>
          <Alert message={`${justLoggedOut?'LoggedOut Succesfully. Redirecting...':'User Not Found. Login to Continue. Redirecting...'}`} ok={false}/>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header div1Ref={div1Ref} homepage={false}/>

      <div ref={div1Ref} className={`z-2 relative h-[100vh] w-screen flex flex-col items-center justify-center ${mont.className}`}>
        <img src={`/bg_img/landingpage_parallax.png`} alt="" className="absolute z-2 w-full h-full object-cover object-bottom"/>
        <div className="h-[20%] w-full"></div>
        <div className="h-[80%] z-3 w-full flex flex-col items-center justify-end text-white font-medium text-[3vh] px-[5vw] pb-[10vh] text-center">
          <motion.div className="text-[7vh] font-bold"
          style={{ transform: `translateY(-${offsetY}px)`, transition: 'transform 0.1s linear' }}>ZenithVapourCast Dashboard</motion.div>
          <motion.div style={{ transform: `translateY(-${offsetY}px)`, transition: 'transform 0.1s linear' }} className="text-[2vh]">Explore region-wise precipitable‑water estimates derived from GNSS zenith‑wet delay, with temperature, pressure, and humidity for quick situational awareness</motion.div>
        </div>
      </div>

      <div className={`h-[100vh] w-screen flex flex-col items-center justify-center relative ${mont.className}`}>
        <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover"/>
        <div className="h-[23vh] w-full flex flex-col items-center justify-center relative text-water-5">
          <span className="z-6 text-[4vh] font-bold">Regional GNSS HeatMap</span>
          <span className="z-6 text-[2vh] font-medium">Regions, stations, or custom bounds to load GNSS coverage and calibrations; adjust layers and time windows to focus analysis where it matters most</span>
        </div>
        <div className="h-[77vh] w-full flex items-center justify-center p-[4vh] rounded-xl">
          <div className="h-full w-full flex items-center justify-center relative">
            <img src={`/bg_noise/white.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
            <iframe src="/gnss_station_heatmap_with_markers_2.html" width="100%" height="600px" className="z-10 rounded-xl border-0"></iframe>
          </div>
        </div>
      </div>
      
      <div className={`h-[100vh] w-screen flex flex-col items-center justify-center relative ${mont.className}`}>
        <img src={`/bg_noise/water-4.png`} alt="" className="absolute z-2 w-full h-full object-cover"/>
        <div className="h-[23vh] w-full flex flex-col items-center justify-center relative text-water-1 text-center px-[10vh]">
          <span className="z-6 text-[4vh] font-bold">Data Input & Upload</span>
          <span className="z-6 text-[2vh] font-medium">Choose an input path—live station feed, CSV upload, or API request—to run PW inference; each row below shows a different method with required fields and sample templates</span>
        </div>
        <div className="h-[77vh] w-full flex items-center justify-center p-[4vh] rounded-xl gap-[2vh] text-water-5 font-medium">
          
          <div className="h-full w-1/4 flex flex-col items-center justify-center z-5 rounded-xl relative p-[2vh]">
            <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
            <div className="h-[20%] w-full flex items-center justify-center z-5 font-bold text-[2vh]">Get PW By RINEX</div>
            <div className="h-[30%] w-full flex flex-col items-start justify-start z-5 font-medium text-[1.54vh]">
              <span><strong>Format:</strong>&nbsp; RINEX (Receiver Independent Exchange Format) observation files</span>
              <span><strong>Compression:</strong>&nbsp; Unix compress format (.Z extension)</span>
              <span><strong>Content:</strong>&nbsp; Satellite observation data including carrier phase, pseudorange, Doppler, and signal strength measurements</span>
            </div>
            <div className="h-[50%] w-full flex flex-col items-center justify-center z-5 font-bold text-[2vh]">
              <div className="h-[70%] w-full flex flex-col items-start justify-center gap-[1vh]">
                <span className="text-[1.54vh] font-bold">Upload RINEX File (.Z)</span>
                <input 
                  type="file" 
                  id="rinex-file" 
                  accept=".Z" 
                  onChange={handleFileChange} 
                  className="h-auto w-full p-[0.54vh] rounded-xl flex items-center justify-center bg-water-5 text-[1.54vh] text-water-1"
                />
                
                <div className="w-full flex flex-col gap-[0.5vh] mt-[1vh]">
                  <label className="text-[1.3vh] flex items-center gap-[0.5vw]">
                    <input 
                      type="checkbox" 
                      checked={includeMeteoData} 
                      onChange={() => setIncludeMeteoData(!includeMeteoData)} 
                    />
                    Include meteorological data
                  </label>
                  
                  <label className="text-[1.3vh] flex items-center gap-[0.5vw]">
                    <input 
                      type="checkbox" 
                      checked={processAllSatellites} 
                      onChange={() => setProcessAllSatellites(!processAllSatellites)} 
                    />
                    Process all satellites (may take longer)
                  </label>
                </div>
                
                <motion.button 
                  onClick={handleByRinex} 
                  disabled={!file || isProcessing}
                  whileHover={{ scale: 1.054 }} 
                  whileTap={{ scale: 0.97 }} 
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`relative z-3 h-auto w-auto flex items-center justify-center gap-[1vw] p-[1vh] text-[1.27vh] font-bold rounded cursor-pointer mt-[1vh] ${!file || isProcessing ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-70" : "bg-water-5 text-water-1 hover:opacity-[0.77]"}`}
                  style={{backgroundImage: "url('/bg_noise/water-5.png')", backgroundSize: 'cover'}}
                >
                  {isProcessing ? (
                    <>
                      <span className="z-3 text-water-1 text-[1.27vh]">Processing...</span>
                    </>
                  ) : (
                    <span className="z-3 text-water-1 text-[1.27vh]">Get Results</span>
                  )}
                </motion.button>
              </div>
              
              <div className="h-[30%] w-full flex flex-col items-center justify-center">
                {processingProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-water-5 h-2.5 rounded-full" 
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                )}
                
                {errorMessage && (
                  <div className="text-red-500 text-[1.3vh] mt-2">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="h-full w-1/4 flex flex-col items-center justify-center z-5 rounded-xl relative p-[2vh]">
            <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
            <div className="h-[20%] w-full flex items-center justify-center z-5 font-bold text-[2vh]">Get PW By All Features</div>
            <div className="h-[20%] w-full flex flex-col items-start justify-start z-5 font-medium text-[1.54vh]">
              <span><strong>Required Fields:</strong>&nbsp;
                Station ID, Year, Month, Day, Hour, Minute, Second, Date (ISO Format), Station Latitude, Station Longitude, Station Elevation, Timestamp (Epoch), ZWD Observation, Satellite Azimuth, Satellite Elevation, Temperature (°C), Pressure (hPa), Humidity (%)
              </span>
            </div>
            <div className="h-[60%] w-full flex items-center justify-center z-5 font-bold text-[2vh]">
            </div>
          </div>

          <div className="h-full w-1/4 flex flex-col items-center justify-center z-5 rounded-xl relative p-[2vh]">
            <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
            <div className="h-[20%] w-full flex items-center justify-center z-5 text-center font-bold text-[2vh]">Get PW For Custom Coordinates (Interpolation)</div>
            <div className="h-[20%] w-full flex flex-col items-start justify-start z-5 font-medium text-[1.54vh]">
              <span><strong>Required Fields:</strong>&nbsp;
              Latitude, Longitude
              </span>
            </div>
            <div className="h-[60%] w-full flex flex-col items-center justify-center z-5 font-bold text-[2vh] gap-[2vh]">
              <div className="h-auto w-full">
                <label className="block text-[1.54vh] font-medium mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g., 34.0522"
                  className="w-full h-auto p-[1vh] rounded-xl border border-water-5 text-[1.54vh] focus:outline-none focus:ring-2 focus:ring-water-5"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="h-auto w-full">
                <label className="block text-[1.54vh] font-medium mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g., -118.2437"
                  className="w-full h-auto p-[1vh] rounded-xl border border-water-5 text-[1.54vh] focus:outline-none focus:ring-2 focus:ring-water-5"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
              <motion.button
                onClick={handleInterpolation}
                disabled={!latitude || !longitude || isProcessingInterpolation}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-[1vh] rounded-xl text-[1.3vh] font-bold ${
                  !latitude || !longitude || isProcessingInterpolation
                    ? "bg-water-5/50 text-gray-200 cursor-not-allowed"
                    : "bg-water-5 text-white hover:opacity-[0.54] cursor-pointer"
                }`}
              >
                {isProcessingInterpolation ? "Processing..." : "Get Interpolated PW"}
              </motion.button>
            </div>
          </div>

          <div className="h-full w-1/4 flex flex-col items-center justify-center z-5 rounded-xl relative p-[2vh]">
            <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
            <div className="h-[20%] w-full flex items-center justify-center z-5 text-center font-bold text-[2vh]">Get Error in Interpolation for PW</div>
            <div className="h-[20%] w-full flex flex-col items-start justify-start z-5 font-medium text-[1.54vh]">
              <span><strong>Required Fields:</strong>&nbsp;
              </span>
            </div>
            <div className="h-[60%] w-full flex items-center justify-center z-5 font-bold text-[2vh]"></div>
          </div>
        </div>
      </div>

      <div id='result' className={`h-auto w-screen flex items-center justify-center z-5 ${mont.className}`}>
        {result && (
          <div className="h-[69vh] w-full flex items-center justify-center relative z-5 p-[2vh]">
            <img src={`/bg_noise/water-4.png`} alt="" className="absolute z-2 w-full h-full object-cover"/>
            <div className="h-full w-auto px-[2vh] flex flex-col items-center justify-center relative z-5">
              <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
              <div className="h-[10%] w-full flex items-center justify-center text-[2vh] font-bold text-water-5 z-5">Processing Results</div>
              <div className="h-[60%] w-full flex items-center justify-center">
                <div className="h-full w-1/2 flex flex-col items-center justify-start text-[2vh] font-bold text-water-5 z-5 pt-[5vh]">
                  <span>Extracted Data</span>
                  <div className="h-auto w-auto flex flex-col items-start justify-center font-medium text-[1.54vh] mt-[1vh]">
                      <div><strong>Station ID:</strong> {result.extractedData.stationId}</div>
                      <div><strong>Latitude:</strong> {result.extractedData.stationLatitude}</div>
                      <div><strong>Longitude:</strong> {result.extractedData.stationLongitude}</div>
                      <div><strong>Elevation:</strong> {result.extractedData.stationElevation}</div>
                      <div><strong>ZWD Observation:</strong> {result.extractedData.zwdObservation}</div>
                      <div><strong>Satellite Azimuth:</strong> {result.extractedData.satelliteAzimuth}</div>
                      <div><strong>Satellite Elevation:</strong> {result.extractedData.satelliteElevation}</div>
                      <div><strong>Temperature:</strong> {result.extractedData.temperature || 'N/A'}°C</div>
                      <div><strong>Pressure:</strong> {result.extractedData.pressure || 'N/A'} hPa</div>
                      <div><strong>Humidity:</strong> {result.extractedData.humidity || 'N/A'}%</div>
                      <div><strong>Timestamp:</strong> {new Date(result.extractedData.timestamp * 1000).toLocaleString()}</div>
                    </div>
                </div>
                <div className="h-full w-1/2 flex flex-col items-center justify-start text-[2vh] font-bold text-water-5 z-5 pt-[5vh]">
                  <span>Prediction Results</span>
                  <div className="h-auto w-auto flex flex-col items-start justify-center font-medium text-[1.54vh] mt-[1vh]">
                      <div><strong>Predicted PW:</strong> {result.prediction.predicted_pw}</div>
                      <div><strong>Uncertainty:</strong> {result.prediction.uncertainty}</div>
                      <div><strong>Method:</strong> {result.prediction.method}</div>
                      {/* {result.prediction.note && (<div className="col-span-2"><strong>Note:</strong> {result.prediction.note}</div>)} */}
                      {result.prediction.error && (<div className="col-span-2 text-red-600"><strong>Error:</strong> {result.prediction.error}</div>)}
                    </div>
                </div>
              </div>
              <div className="h-[30%] w-full flex flex-col items-center justify-start z-5 text-water-5">
                <h3 className="text-[2vh] font-bold">File Info</h3>
                <div className="text-[1.5vh] mt-[1vh]">
                  <p><strong>Original Name:</strong> {result.fileInfo.originalName}</p>
                  <p><strong>Station ID:</strong> {result.fileInfo.stationId}</p>
                  <p><strong>Processed At:</strong> {new Date(result.fileInfo.processedAt).toLocaleString()}</p>
                </div>
                <motion.button onClick={()=>setResult(null)} whileHover={{ scale: 1.054 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-4 mt-[2vh] h-auto w-auto flex items-center justify-center gap-[1vw] p-[1vh] text-water-1 text-[1.54vh] font-bold rounded-xl cursor-pointer hover:opacity-[0.77]"
                  style={{backgroundImage: "url('/bg_noise/water-5.png')", backgroundSize: 'cover'}}
                  >Close
                </motion.button>
              </div>
            </div>
          </div>
        )}
        {interpolationResult && (
          <div className="h-[69vh] w-full flex items-center justify-center relative z-5 p-[2vh]">
            <img src={`/bg_noise/water-4.png`} alt="" className="absolute z-2 w-full h-full object-cover"/>
            <div className="h-full w-auto px-[2vh] flex flex-col items-center justify-center relative z-5">
              <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
              <div className="h-[10%] w-full flex items-center justify-center text-[2vh] font-bold text-water-5 z-5">Interpolation Results</div>
              <div className="h-[60%] w-full flex items-center justify-center">
                <div className="h-full w-1/2 flex flex-col items-center justify-start text-[2vh] font-bold text-water-5 z-5 pt-[5vh]">
                  <span>Coordinates</span>
                  <div className="h-auto w-auto flex flex-col items-start justify-center font-medium text-[1.54vh] mt-[1vh]">
                      <div><strong>Latitude:</strong> {latitude}</div>
                      <div><strong>Longitude:</strong> {longitude}</div>
                    </div>
                </div>
                <div className="h-full w-1/2 flex flex-col items-center justify-start text-[2vh] font-bold text-water-5 z-5 pt-[5vh]">
                  <span>Prediction Results</span>
                  <div className="h-auto w-auto flex flex-col items-start justify-center font-medium text-[1.54vh] mt-[1vh]">
                      <div><strong>Predicted PW:</strong> {interpolationResult.prediction?.predicted_pw}</div>
                      <div><strong>Uncertainty:</strong> {interpolationResult.prediction?.uncertainty}</div>
                      <div><strong>Method:</strong> {interpolationResult.prediction?.method}</div>
                      {/* {interpolationResult.prediction?.note && (<div className="col-span-2"><strong>Note:</strong> {interpolationResult.prediction.note}</div>)} */}
                    </div>
                </div>
              </div>
              <div className="h-[30%] w-full flex flex-col items-center justify-start z-5 text-water-5">
                <motion.button onClick={() => setInterpolationResult(null)} whileHover={{ scale: 1.054 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-4 mt-[2vh] h-auto w-auto flex items-center justify-center gap-[1vw] p-[1vh] text-water-1 text-[1.54vh] font-bold rounded-xl cursor-pointer hover:opacity-[0.77]"
                  style={{backgroundImage: "url('/bg_noise/water-5.png')", backgroundSize: 'cover'}}
                  >Close
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}