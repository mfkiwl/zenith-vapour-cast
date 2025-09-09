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
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dynamic from "next/dynamic";


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

interface LocationMarkerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  position: [number, number] | null;
}

// LocationMarker component with proper typing
function LocationMarker({ onLocationSelect, position }: LocationMarkerProps) {
  useMapEvents({
    click(e: { latlng: LatLng }) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  return position ? <Marker position={position} /> : null;
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

  const [featuresData, setFeaturesData] = useState({
    stationId: '',
    year: '',
    month: '',
    day: '',
    hour: '',
    minute: '',
    second: '',
    dateString: '',
    stationLatitude: '',
    stationLongitude: '',
    stationElevation: '',
    timestamp: '',
    zwdObservation: '',
    satelliteAzimuth: '',
    satelliteElevation: '',
    temperature: '',
    pressure: '',
    humidity: ''
  });

  const [isProcessingFeatures, setIsProcessingFeatures] = useState(false);
  const [featuresResult, setFeaturesResult] = useState<any>(null);

  const handleFeaturesChange = (field: string, value: string) => {
    setFeaturesData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeaturesSubmit = async () => {
    try {
      setIsProcessingFeatures(true);
      
      // Validate required fields
      const requiredFields = [
        'stationId', 'year', 'month', 'day', 'hour', 'minute', 'second',
        'stationLatitude', 'stationLongitude', 'zwdObservation'
      ];
      
      const missingFields = requiredFields.filter(field => !featuresData[field as keyof typeof featuresData]);
      
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      const reqToken = token || session?.accessToken;
      
      const response = await fetch("http://localhost:3001/api/pw/by/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${reqToken}`,
        },
        body: JSON.stringify({
          ...featuresData,
          // Convert numeric fields to numbers
          year: parseInt(featuresData.year),
          month: parseInt(featuresData.month),
          day: parseInt(featuresData.day),
          hour: parseInt(featuresData.hour),
          minute: parseInt(featuresData.minute),
          second: parseInt(featuresData.second),
          stationLatitude: parseFloat(featuresData.stationLatitude),
          stationLongitude: parseFloat(featuresData.stationLongitude),
          stationElevation: parseFloat(featuresData.stationElevation || '0'),
          timestamp: parseInt(featuresData.timestamp || String(Math.floor(Date.now() / 1000))),
          zwdObservation: parseFloat(featuresData.zwdObservation),
          satelliteAzimuth: parseFloat(featuresData.satelliteAzimuth || '0'),
          satelliteElevation: parseFloat(featuresData.satelliteElevation || '0'),
          temperature: parseFloat(featuresData.temperature || '0'),
          pressure: parseFloat(featuresData.pressure || '0'),
          humidity: parseFloat(featuresData.humidity || '0')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to process features");
      }

      const result = await response.json();
      console.log("Features result:", result);
      setFeaturesResult(result);
      
    } catch (error: any) {
      console.error("Error handling features:", error);
      alert(error.message || "Error processing features");
    } finally {
      setIsProcessingFeatures(false);
    }
  };


  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const handleMapClick = (lat: number, lng: number) => {
    const latStr = lat.toFixed(6);
    const lngStr = lng.toFixed(6);
    
    setLatitude(latStr);
    setLongitude(lngStr);
    setSelectedLocation([lat, lng]);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsProcessingInterpolation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const latStr = lat.toFixed(6);
          const lngStr = lng.toFixed(6);
          
          setLatitude(latStr);
          setLongitude(lngStr);
          setSelectedLocation([lat, lng]);
          setIsProcessingInterpolation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services or enter coordinates manually.');
          setIsProcessingInterpolation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleInterpolation = async () => {
    if (!latitude || !longitude) return;
    
    try {
      setIsProcessingInterpolation(true);
      const reqToken = token || session?.accessToken;
      
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to get interpolated PW");
      }

      const result = await response.json();
      console.log("Interpolation result:", result);
      setInterpolationResult(result);
      
    } catch (error: any) {
      console.error("Error handling interpolation:", error);
      alert(error.message || "Error getting interpolated PW");
    } finally {
      setIsProcessingInterpolation(false);
    }
  };

  const handleInputChange = (type: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (type === 'lat') {
      setLatitude(value);
      if (!isNaN(numValue) && selectedLocation) {
        setSelectedLocation([numValue, selectedLocation[1]]);
      }
    } else {
      setLongitude(value);
      if (!isNaN(numValue) && selectedLocation) {
        setSelectedLocation([selectedLocation[0], numValue]);
      }
    }
  };


  const [errorLatitude, setErrorLatitude] = useState("");
  const [errorLongitude, setErrorLongitude] = useState("");
  const [estimatedPW, setEstimatedPW] = useState("");
  const [isProcessingError, setIsProcessingError] = useState(false);
  const [errorResult, setErrorResult] = useState<{
    estimatedPW: string;
    interpolatedPW: string;
    absoluteError: string;
    relativeError: string;
    interpretation?: string;
  } | null>(null);
  const handleErrorCalculation = async () => {
    if (!errorLatitude || !errorLongitude || !estimatedPW) return;

    try {
      setIsProcessingError(true);
      setErrorResult(null);

      const reqToken = token || session?.accessToken;
      
      // First, get the interpolated PW value
      const interpolationResponse = await fetch("http://localhost:3001/api/pw/by/interpolation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${reqToken}`,
        },
        body: JSON.stringify({
          latitude: parseFloat(errorLatitude),
          longitude: parseFloat(errorLongitude),
        }),
      });

      if (!interpolationResponse.ok) {
        throw new Error("Failed to get interpolated PW value");
      }

      const interpolationData = await interpolationResponse.json();
      const interpolatedPW = interpolationData.prediction?.predicted_pw || interpolationData.prediction?.predicted_pw;

      if (!interpolatedPW) {
        throw new Error("No interpolated PW value received");
      }

      // Calculate errors
      const estimated = parseFloat(estimatedPW);
      const interpolated = parseFloat(interpolatedPW);
      const absoluteError = Math.abs(estimated - interpolated).toFixed(4);
      const relativeError = ((Math.abs(estimated - interpolated) / interpolated) * 100).toFixed(2);

      // Provide interpretation
      let interpretation = "";
      const relativeErrorNum = parseFloat(relativeError);
      
      if (relativeErrorNum < 2) {
        interpretation = "Excellent estimate! Very close to interpolated value.";
      } else if (relativeErrorNum < 5) {
        interpretation = "Good estimate. Reasonably close to interpolated value.";
      } else if (relativeErrorNum < 10) {
        interpretation = "Fair estimate. Some deviation from interpolated value.";
      } else {
        interpretation = "Significant deviation. Consider recalibrating your estimation.";
      }

      setErrorResult({
        estimatedPW: estimatedPW,
        interpolatedPW: interpolatedPW.toString(),
        absoluteError,
        relativeError,
        interpretation
      });

    } catch (error: any) {
      console.error("Error calculating interpolation error:", error);
      alert(error.message || "Error calculating interpolation error");
    } finally {
      setIsProcessingError(false);
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
          <motion.div className="text-[7vh] font-bold relative z-6" style={{ transform: `translateY(-${offsetY}px)`, transition: 'transform 0.1s linear' }}>
            <img src={`/logos/zenithvapourcast_nobg.png`} alt="" className="z-6 w-auto h-[38vh] mb-[17vh] object-cover"/>
          </motion.div>
          <motion.div className="text-[7vh] font-bold" style={{ transform: `translateY(-${offsetY}px)`, transition: 'transform 0.1s linear' }}>ZenithVapourCast Dashboard</motion.div>
          <motion.div style={{ transform: `translateY(-${offsetY}px)`, transition: 'transform 0.1s linear' }} className="text-[2vh]">Explore region-wise precipitable‑water estimates derived from GNSS zenith‑wet delay, with temperature, pressure, and humidity for quick situational awareness</motion.div>
        </div>
      </div>

      <div className={`h-[100vh] w-screen flex flex-col items-center justify-center relative ${mont.className}`}>
        <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover"/>
        <div className="h-[20%] w-full flex flex-col items-center justify-center relative text-water-5">
          <span className="z-6 text-[4vh] font-bold">Regional GNSS HeatMap</span>
          <span className="z-6 text-[2vh] font-medium">Regions, stations, or custom bounds to load GNSS coverage and calibrations; adjust layers and time windows to focus analysis where it matters most</span>
        </div>
        <div className="h-[70%] w-full flex items-center justify-center p-[4vh] rounded-xl">
          <div className="h-full w-full flex items-center justify-center relative">
            <img src={`/bg_noise/white.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
            <iframe src="/gnss_station_heatmap_with_markers_2.html" width="100%" height="97%" className="z-10 rounded-xl border-0"></iframe>
          </div>
        </div>
        <div className="h-[10%] w-full flex items-center justify-center p-[4vh] rounded-xl">

        </div>
      </div>
      
      <div className={`h-[110vh] w-screen flex flex-col items-center justify-center relative ${mont.className}`}>
        <img src={`/bg_noise/water-4.png`} alt="" className="absolute z-2 w-full h-full object-cover"/>
        <div className="h-[23vh] w-full flex flex-col items-center justify-center relative text-water-1 text-center px-[10vh]">
          <span className="z-6 text-[4vh] font-bold">Data Input & Upload</span>
          <span className="z-6 text-[2vh] font-medium">Choose an input path—live station feed, CSV upload, or API request—to run PW inference; each row below shows a different method with required fields and sample templates</span>
        </div>
        <div className="h-[87vh] w-full flex items-center justify-center p-[4vh] rounded-xl gap-[2vh] text-water-5 font-medium">
          
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
            <div className="h-[30%] w-full flex flex-col items-start justify-start z-5 font-medium text-[1.54vh]">
              <span><strong>Required Fields:</strong>&nbsp;
                Station ID, Year, Month, Day, Hour, Minute, Second, Date (ISO Format), Station Latitude, Station Longitude, Station Elevation, Timestamp (Epoch), ZWD Observation, Satellite Azimuth, Satellite Elevation, Temperature (°C), Pressure (hPa), Humidity (%)
              </span>
            </div>
            <div className="h-[50%] w-full flex items-center justify-start z-5 font-bold text-[2vh] relative rounded-xl text-water-1">
              <img src={`/bg_noise/water-5.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
              <div className="h-full w-full flex flex-col flex-nowrap p-[2vh] gap-[2vh] items-start justify-start overflow-y-auto z-5 font-bold text-[2vh] relative rounded-xl text-water-1">
                {/* Station Information */}
                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Station ID*
                  <input
                    type="text"
                    placeholder="Station ID"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.stationId}
                    onChange={(e) => handleFeaturesChange('stationId', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Latitude*
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.stationLatitude}
                    onChange={(e) => handleFeaturesChange('stationLatitude', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Longitude*
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.stationLongitude}
                    onChange={(e) => handleFeaturesChange('stationLongitude', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Elevation
                  <input
                    type="number"
                    step="any"
                    placeholder="Elevation"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.stationElevation}
                    onChange={(e) => handleFeaturesChange('stationElevation', e.target.value)}
                  />
                </label>

                {/* Date and Time */}
                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Year*
                  <input
                    type="number"
                    placeholder="Year"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.year}
                    onChange={(e) => handleFeaturesChange('year', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Month*
                  <input
                    type="number"
                    placeholder="Month (1-12)"
                    min="1"
                    max="12"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.month}
                    onChange={(e) => handleFeaturesChange('month', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Day*
                  <input
                    type="number"
                    placeholder="Day (1-31)"
                    min="1"
                    max="31"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.day}
                    onChange={(e) => handleFeaturesChange('day', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Hour*
                  <input
                    type="number"
                    placeholder="Hour (0-23)"
                    min="0"
                    max="23"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.hour}
                    onChange={(e) => handleFeaturesChange('hour', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Minute*
                  <input
                    type="number"
                    placeholder="Minute (0-59)"
                    min="0"
                    max="59"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.minute}
                    onChange={(e) => handleFeaturesChange('minute', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Second*
                  <input
                    type="number"
                    placeholder="Second (0-59)"
                    min="0"
                    max="59"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.second}
                    onChange={(e) => handleFeaturesChange('second', e.target.value)}
                  />
                </label>

                {/* GNSS Observations */}
                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  ZWD Observation*
                  <input
                    type="number"
                    step="any"
                    placeholder="ZWD Observation"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.zwdObservation}
                    onChange={(e) => handleFeaturesChange('zwdObservation', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Satellite Azimuth
                  <input
                    type="number"
                    step="any"
                    placeholder="Satellite Azimuth"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.satelliteAzimuth}
                    onChange={(e) => handleFeaturesChange('satelliteAzimuth', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Satellite Elevation
                  <input
                    type="number"
                    step="any"
                    placeholder="Satellite Elevation"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.satelliteElevation}
                    onChange={(e) => handleFeaturesChange('satelliteElevation', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Timestamp (epoch)
                  <input
                    type="number"
                    step="any"
                    placeholder="Timestamp"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.timestamp}
                    onChange={(e) => handleFeaturesChange('timestamp', e.target.value)}
                  />
                </label>

                {/* Meteorological Data */}
                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Temperature (°C)
                  <input
                    type="number"
                    step="any"
                    placeholder="Temperature"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.temperature}
                    onChange={(e) => handleFeaturesChange('temperature', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Pressure (hPa)
                  <input
                    type="number"
                    step="any"
                    placeholder="Pressure"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.pressure}
                    onChange={(e) => handleFeaturesChange('pressure', e.target.value)}
                  />
                </label>

                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Humidity (%)
                  <input
                    type="number"
                    step="any"
                    placeholder="Humidity"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.humidity}
                    onChange={(e) => handleFeaturesChange('humidity', e.target.value)}
                  />
                </label>

                {/* ISO Date String */}
                <label className="text-[1.54vh] flex flex-col items-start justify-start gap-[0.5vw] w-full">
                  Date (ISO Format) - optional
                  <input
                    type="text"
                    placeholder="YYYY-MM-DDTHH:MM:SSZ"
                    className="p-1 text-[1.54vh] border rounded-xl w-full"
                    value={featuresData.dateString}
                    onChange={(e) => handleFeaturesChange('dateString', e.target.value)}
                  />
                </label>

                <motion.button
                  onClick={handleFeaturesSubmit}
                  disabled={isProcessingFeatures}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-auto w-full px-[2vh] py-[1vh] flex items-center justify-start rounded-xl text-[1.54vh] font-bold mt-2 ${
                    isProcessingFeatures
                      ? "bg-water1/50 text-water-5 cursor-not-allowed"
                      : "bg-water-1 text-water-5 hover:opacity-[0.77]"
                  }`}
                >
                  {isProcessingFeatures ? "Processing..." : "Calculate PW"}
                </motion.button>
              </div>
            </div>
          </div>





          <div className="h-full w-1/4 flex flex-col items-center justify-center z-5 rounded-xl relative p-[2vh]">
            <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
            
            <div className="h-[20%] w-full flex items-center justify-center z-5 text-center font-bold text-[2vh]">
              Get PW For Custom Coordinates (Interpolation)
            </div>
            
            <div className="h-[7%] w-full flex flex-col items-start justify-start z-5 font-medium text-[1.54vh]">
              <span><strong>Required Fields:</strong>&nbsp;Latitude, Longitude</span>
            </div>
            
            <div className="h-[73%] w-full flex flex-col items-center justify-center z-5 font-bold text-[2vh] gap-[2vh]">
              
              {/* Coordinate Input Section */}
              <div className="h-[40%] w-full flex flex-col items-center justify-center z-5 font-bold text-[2vh] gap-[2vh]">
                <div className="h-auto w-full">
                  <label className="block text-[1.54vh] font-bold mb-1">Latitude*</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 34.0522"
                    className="w-full h-auto p-[1vh] rounded-xl border border-water-5 text-[1.54vh] focus:outline-none focus:ring-2 focus:ring-water-5"
                    value={latitude}
                    onChange={(e) => handleInputChange('lat', e.target.value)}
                    min="-90"
                    max="90"
                  />
                </div>
                <div className="h-auto w-full">
                  <label className="block text-[1.54vh] font-bold mb-1">Longitude*</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., -118.2437"
                    className="w-full h-auto p-[1vh] rounded-xl border border-water-5 text-[1.54vh] focus:outline-none focus:ring-2 focus:ring-water-5"
                    value={longitude}
                    onChange={(e) => handleInputChange('lng', e.target.value)}
                    min="-180"
                    max="180"
                  />
                </div>
              </div>

              {/* Separator */}
              <div className="h-[5%] w-full flex items-center justify-center z-5">
                <div className="w-full border-t border-water-5"></div>
                <span className="px-[2vh] text-[1.54vh] text-water-5 font-bold">OR</span>
                <div className="w-full border-t border-water-5"></div>
              </div>

              {/* Map Integration Section */}
              <div className="h-[45%] w-full flex flex-col items-center justify-center z-5 font-bold text-[2vh] gap-[2vh] relative rounded-xl">
                <div className="w-full h-full rounded-xl border-2 border-water-5/30 relative overflow-hidden">
                  <MapContainer
                    center={selectedLocation || [0, 0]}
                    zoom={selectedLocation ? 10 : 2}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-xl"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker 
                      onLocationSelect={handleMapClick} 
                      position={selectedLocation} 
                    />
                  </MapContainer>
                  
                  {/* Current coordinates overlay */}
                  {(latitude && longitude) && (
                    <div className="absolute bottom-2 left-2 bg-water-5/90 text-white text-[1.1vh] px-2 py-1 rounded-lg z-[1000]">
                      📍 {latitude}, {longitude}
                    </div>
                  )}
                </div>

                {/* Current Location Button */}
                <motion.button
                  onClick={getCurrentLocation}
                  disabled={isProcessingInterpolation}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-[1vh] rounded-xl text-[1.27vh] font-bold bg-water-3 text-water-1 hover:bg-water-4 z-10"
                >
                  Or, Use My Current Location
                </motion.button>
              </div>

              {/* Submit Button Section */}
              <div className="h-[10%] w-full flex flex-col items-center justify-center z-5 font-bold text-[1.54vh]">
                <motion.button
                  onClick={handleInterpolation}
                  disabled={!latitude || !longitude || isProcessingInterpolation}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-[1vh] rounded-xl text-[1.3vh] font-bold ${
                    !latitude || !longitude || isProcessingInterpolation
                      ? "bg-water-5/50 text-gray-200 cursor-not-allowed"
                      : "bg-water-5 text-white hover:opacity-[0.8] cursor-pointer shadow-lg"
                  }`}
                >
                  {isProcessingInterpolation ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Processing...
                    </span>
                  ) : (
                    "Get Interpolated PW"
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          
          
          
          
          
          
          <div className="h-full w-1/4 flex flex-col items-center justify-center z-5 rounded-xl relative p-[2vh]">
            <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
            <div className="h-[20%] w-full flex items-center justify-center z-5 text-center font-bold text-[2vh]">Get Error in Interpolation for PW</div>
            <div className="h-[20%] w-full flex flex-col items-start justify-start z-5 font-medium text-[1.54vh]">
              <span><strong>Required Fields:</strong>&nbsp;Latitude, Longitude, Estimated PW
              </span>
            </div>
            <div className="h-[60%] w-full flex items-start justify-center z-5 font-bold text-[2vh]">
              {/* Coordinate Input Section */}
              <div className="h-[40%] w-full flex flex-col items-center justify-center z-5 font-bold text-[2vh] gap-[2vh]">
                <div className="h-auto w-full">
                  <label className="block text-[1.54vh] font-bold mb-1">Latitude*</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 34.0522"
                    className="w-full h-auto p-[1vh] rounded-xl border border-water-5 text-[1.54vh] focus:outline-none focus:ring-2 focus:ring-water-5"
                    value={errorLatitude}
                    onChange={(e) => setErrorLatitude(e.target.value)}
                    min="-90"
                    max="90"
                  />
                </div>
                <div className="h-auto w-full">
                  <label className="block text-[1.54vh] font-bold mb-1">Longitude*</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., -118.2437"
                    className="w-full h-auto p-[1vh] rounded-xl border border-water-5 text-[1.54vh] focus:outline-none focus:ring-2 focus:ring-water-5"
                    value={errorLongitude}
                    onChange={(e) => setErrorLongitude(e.target.value)}
                    min="-180"
                    max="180"
                  />
                </div>
                <div className="h-auto w-full">
                  <label className="block text-[1.54vh] font-bold mb-1">Estimated PW*</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., -118.2437"
                    className="w-full h-auto p-[1vh] rounded-xl border border-water-5 text-[1.54vh] focus:outline-none focus:ring-2 focus:ring-water-5"
                    value={estimatedPW}
                    onChange={(e) => setEstimatedPW(e.target.value)}
                    min="-180"
                    max="180"
                  />
                </div>
                <motion.button
                  onClick={handleErrorCalculation}
                  disabled={!errorLatitude || !errorLongitude || !estimatedPW || isProcessingError}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-[1vh] rounded-xl text-[1.3vh] font-bold ${
                    !errorLatitude || !errorLongitude || !estimatedPW || isProcessingError
                      ? "bg-water-5/50 text-gray-200 cursor-not-allowed"
                      : "bg-water-5 text-white hover:opacity-[0.8] cursor-pointer shadow-lg"
                  }`}
                >
                  {isProcessingError ? "Calculating..." : "Calculate Error"}
                </motion.button>
              </div>
            </div>
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
        {errorResult && (
          <div className="h-[69vh] w-full flex items-center justify-center relative z-5 p-[2vh]">
            <img src={`/bg_noise/water-4.png`} alt="" className="absolute z-2 w-full h-full object-cover"/>
            <div className="h-full w-auto px-[2vh] flex flex-col items-center justify-center relative z-5">
              <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover rounded-xl"/>
              <div className="h-[10%] w-full flex items-center justify-center text-[2vh] font-bold text-water-5 z-5">Error Analysis</div>
              <div className="h-[60%] w-full flex items-center justify-center">
                <div className="h-full w-full flex flex-col items-center justify-start text-[2vh] font-bold text-water-5 z-5 pt-[5vh]">
                  <div className="h-auto w-auto flex flex-col items-start justify-center font-medium text-[1.54vh] mt-[1vh]">
                      <div><strong>Your Estimate:</strong>{errorResult.estimatedPW}</div>
                      <div><strong>Interpolated PW:</strong>{errorResult.interpolatedPW}</div>
                      <div><strong>Absolute Error:</strong>{errorResult.absoluteError}</div>
                      <div className={`text-right my-[1vh] text-water-4 font-semibold`}><strong>Relative Error:</strong>{errorResult.relativeError}%</div>
                    </div>
                      {errorResult.interpretation && (
                        <div className="mt-[1vh] text-[1.2vh] text-center italic">
                          {errorResult.interpretation}
                        </div>
                      )}
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