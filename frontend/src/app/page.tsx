'use client';
import Head from "next/head";
import Image from "next/image";
import Header from "./components/Header";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from 'react-intersection-observer';

import { Merriweather, Montserrat } from "next/font/google";
import Raindrop from "./components/Raindrop";
const mont = Montserrat({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'] });


const working = [
  {head: "Feature Engineering", desc: "Spatial and temporal features—latitude, longitude, elevation, month index, and local weather covariates—are normalized and aligned to improve model signal."},
  {head: "Modeling", desc: "Supervised regression maps ZWD and context features to PW, with cross‑validation, error tracking, and region‑wise calibration to generalize across stations."},
  {head: "Inference", desc: "For any region and month, the model estimates PW in near‑real‑time and pairs it with temperature, pressure, and humidity to aid interpretation on the dashboard."},
  {head: "Visualization", desc: "The dashboard renders region cards and timelines so trends and anomalies are obvious at a glance, with export options for further analysis."},
]
const team = [
  {name: "Shreyansh Trivedi", role: "Frontend Developer", desc: "ZenithVapourCast Frontend Development", dp: 'trivedi'},
  {name: "Mooksh Jain", role: "AIML Model Engineer", desc: "GPR Model Development", dp: 'mooksh'},
  {name: "Kriti Khanijo", role: "AIML Model Engineer", desc: "GBR Model Development", dp: 'kriti'},
  {name: "Dharyansh Achlas", role: "(Team Lead) Backend Developer", desc: "ZenithVapourCast Backend Development and Model Integration", dp: 'da'}
];
      
const landingdetails = [
  {region: 1, temp: -3.1, pres: 1012.4, hum: 49, pw: 7.163004, count: 22},
  {region: 2, temp: -5.8, pres: 1021.3, hum: 64, pw: 7.105584, count: 22},
  {region: 3, temp: -2.8, pres: 1008.9, hum: 67, pw: 7.020579, count: 20},
  {region: 4, temp: -6.0, pres: 1019.7, hum: 47, pw: 6.893994, count: 16},
  {region: 5, temp: -4.2, pres: 1012.1, hum: 51, pw: 7.0354085, count: 20}
]

export default function Home() {
  const div1Ref = useRef<HTMLDivElement|null>(null);
  const [offsetY, setOffsetY] = useState(0);
  const {ref:div1Ref2, inView:div1Ref2InView} = useInView({
    triggerOnce: false, 
    threshold: 0.3,
  });

  // parallax scroll
  useEffect(() => {
    const handleScroll = () => {
      // Get how much user has scrolled vertically
      const scrollY = window.scrollY || window.pageYOffset;
      // Multiply scrollY by factor > 1 to make this div move faster (e.g. 1.5)
      setOffsetY(scrollY * 0.27);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Header div1Ref={div1Ref} homepage={true}/>

      {/* div1 */}
      <div ref={div1Ref} className={`h-[100vh] w-screen flex flex-col items-center justify-center relative px-[1vh] pb-[1vh] ${mont.className}`}>
        <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-full h-full object-cover" />
        <img src={`/bg_img/landingpage_parallax.png`} alt="" className="absolute z-3 w-full h-auto object-contain" />
        <div className="absolute top-0 h-[30%] w-full z-10 flex items-center justify-center">
          <img src={`/bg_img/cloud-5.png`} alt="" className="absolute z-4 left-0 w-auto h-[15vh] object-contain bottom-0" />
            <img src={`/bg_img/cloud-4.png`} alt="" className="absolute z-5 left-[10vh] w-auto h-[12vh] object-contain bottom-0" />
              <img src={`/bg_img/cloud-3.png`} alt="" className="absolute z-6 left-[20vh] w-auto h-[10vh] object-contain bottom-0" />
                <img src={`/bg_img/cloud-2.png`} alt="" className="absolute z-7 left-[30vh] w-auto h-[7vh] object-contain bottom-0" />
                  <img src={`/bg_img/cloud-1.png`} alt="" className="absolute z-8 left-[40vh] w-auto h-[5vh] object-contain bottom-0" />

                  <img src={`/bg_img/cloud-1.png`} alt="" className="absolute z-8 left-[20vh] w-auto h-[5vh] object-contain bottom-0" />
                <img src={`/bg_img/cloud-2.png`} alt="" className="absolute z-7 left-[30vh] w-auto h-[7vh] object-contain bottom-0" />
              <img src={`/bg_img/cloud-3.png`} alt="" className="absolute z-6 left-[40vh] w-auto h-[10vh] object-contain bottom-0" />
            <img src={`/bg_img/cloud-4.png`} alt="" className="absolute z-5 left-[50vh] w-auto h-[12vh] object-contain bottom-0" />
                  <img src={`/bg_img/cloud-1.png`} alt="" className="absolute z-8 left-[20vh] w-auto h-[10vh] object-contain bottom-0" />
                <img src={`/bg_img/cloud-1.png`} alt="" className="absolute z-8 left-[50vh] w-auto h-[12vh] object-contain bottom-0" />
          <img src={`/bg_img/cloud-5.png`} alt="" className="absolute z-4 w-auto h-[15vh] object-contain bottom-0" />
                <img src={`/bg_img/cloud-1.png`} alt="" className="absolute z-8 right-[20vh] w-auto h-[12vh] object-contain bottom-0" />
                  <img src={`/bg_img/cloud-1.png`} alt="" className="absolute z-8 right-[50vh] w-auto h-[10vh] object-contain bottom-0" />
            <img src={`/bg_img/cloud-4.png`} alt="" className="absolute z-5 right-[50vh] w-auto h-[12vh] object-contain bottom-0" />
              <img src={`/bg_img/cloud-3.png`} alt="" className="absolute z-6 right-[40vh] w-auto h-[10vh] object-contain bottom-0" />
                <img src={`/bg_img/cloud-2.png`} alt="" className="absolute z-7 right-[30vh] w-auto h-[7vh] object-contain bottom-0" />
                  <img src={`/bg_img/cloud-1.png`} alt="" className="absolute z-8 right-[20vh] w-auto h-[5vh] object-contain bottom-0" />

                  <img src={`/bg_img/cloud-1.png`} alt="" className="absolute z-8 right-[40vh] w-auto h-[5vh] object-contain bottom-0" />
                <img src={`/bg_img/cloud-2.png`} alt="" className="absolute z-7 right-[30vh] w-auto h-[7vh] object-contain bottom-0" />
              <img src={`/bg_img/cloud-3.png`} alt="" className="absolute z-6 right-[20vh] w-auto h-[10vh] object-contain bottom-0" />
            <img src={`/bg_img/cloud-4.png`} alt="" className="absolute z-5 right-[10vh] w-auto h-[12vh] object-contain bottom-0" />
          <img src={`/bg_img/cloud-5.png`} alt="" className="absolute z-4 right-0 w-auto h-[15vh] object-contain bottom-0" />
        </div>


        <div className={`h-full w-full flex items-end justify-center z-3 gap-[1vh] ${mont.className} font-medium`}>
          {landingdetails.map((l,i)=>{
            return(
              <div key={i} className="h-[75%] w-1/5 flex flex-col items-center justify-center relative">
                <Raindrop count={l.count}/>
                <div className="absolute h-[30vh] rounded-xl w-full flex flex-col items-center justify-center bg-water-1/20 bottom-0 text-water-5">
                  <div className="h-[20%] w-full flex items-end justify-center">Region&nbsp;<strong>{l.region}</strong></div>
                  <div className="h-[50%] w-full flex flex-col items-center justify-center">
                    <span>Month: <strong>9 (September)</strong></span>
                    <span>Temperature: <strong>{l.temp}</strong></span>
                    <span>Pressure: <strong>{l.pres}</strong></span>
                    <span>Humidity: <strong></strong>{l.hum}%</span>
                  </div>
                  <div className="h-[30%] w-full flex items-start justify-center">PW: <strong>{l.pw}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`absolute top-0 left-0 h-full w-full flex items-center justify-center z-[100] text-water-5 text-[10vh] font-bold ${mont.className}`}>
        <div className="h-auto w-auto flex flex-col items-center justify-center" style={{ transform: `translateY(-${offsetY}px)`, transition: 'transform 0.1s linear' }}>
          <span>ZenithVapourCast</span>
          <span className="text-[2vh]">High‑resolution precipitable‑water insights from GNSS zenith‑wet delay, powered by ML for clearer nowcasts, smoother planning, and research‑grade transparency</span>
        </div>
      </div>


      {/* div2 */}
      <div className={`h-[54vh] w-screen flex flex-col items-center justify-center relative text-center ${mont.className} p-[4vh]`}>
        <img src={`/bg_noise/water-1.png`} alt="" className="absolute w-full h-full object-cover z-5" />
        <div className="h-[20%] w-full flex items-center justify-center z-5 text-water-5 text-[3vh] font-bold">About</div>
        <span className="z-5 text-water-5 text-[2vh] font-medium">ZenithVapourCast turns raw GNSS observations into actionable tropospheric moisture intelligence by learning the relationship between zenith‑wet delay and precipitable water across regions and seasons.</span>
        <span className="z-5 text-water-5 text-[2vh] font-medium">Built by weather‑curious engineers, it blends robust preprocessing, supervised models, and quality checks to surface PW alongside temperature, pressure, and humidity context on an interactive dashboard.</span>
        <span className="z-5 text-water-5 text-[2vh] font-medium">The goal is simple: make atmospheric water vapour visible and useful for forecasters, researchers, and operations—without the data wrangling overhead.</span>
      </div>
      
      
      {/* div3 */}
      <div className={`h-[54vh] w-screen flex flex-col items-center justify-center relative text-center ${mont.className} p-[4vh]`}>
        <img src={`/bg_noise/water-2.png`} alt="" className="absolute w-full h-full object-cover z-5" />
        <div className="h-[20%] w-full flex items-center justify-center z-5 text-water-5 text-[3vh] font-bold">Working</div>
        <div className="h-[80%] w-full flex items-center justify-center">
          {working.map((w,i)=>{
            return(
            <div key={i} className="h-full w-1/4 flex flex-col items-center justify-center z-5 p-[1vh] gap-[2vh]">
              <div className="h-[40%] w-full flex items-center justify-center relative">
                <img src={`/bg_img/${i+1}.png`} alt="" className="absolute w-auto h-full object-contain z-3" />
              </div>
              <div className="h-[60%] w-full flex flex-col items-center justify-start gap-[2vh]">
                <strong className="text-[2vh]">{w.head}</strong>
                <span>{w.desc}</span>
              </div>
            </div>
        )})}
        </div>
        {/* <span className="z-6 text-water-5 text-[2vh]"><strong>Feature </strong>: </span>
        <span className="z-6 text-water-5 text-[2vh]"><strong>Modeling:</strong> Supervised regression maps ZWD and context features to PW, with cross‑validation, error tracking, and region‑wise calibration to generalize across stations.</span>
        <span className="z-6 text-water-5 text-[2vh]"><strong>Inference:</strong> For any region and month, the model estimates PW in near‑real‑time and pairs it with temperature, pressure, and humidity to aid interpretation on the dashboard.</span>
        <span className="z-6 text-water-5 text-[2vh]"><strong>Visualization:</strong> The dashboard renders region cards and timelines so trends and anomalies are obvious at a glance, with export options for further analysis.</span> */}
      </div>


      {/* div5 - team */}
      <div id='team' className={`relative h-[54vh] w-full flex flex-col items-center justify-center ${mont.className}`}>
        <img src={`/bg_noise/water-3.png`} alt="" className="absolute z-1 h-full w-full object-cover"/>
        {/* <img src={`/landingpage_harvestborder/1.png`} alt="" className="absolute z-1 h-auto w-full object-contain"/> */}
        <div className="h-[20%] w-full flex items-end justify-center text-darker-green font-bold text-[3vh] z-4">Team - MaSKeD</div>
        <div className="h-[70%] w-full flex items-center justify-center gap-[2vh] px-[2vh]">
          {team.map((t,i)=>{
            return(
              <div key={i} className="h-[90%] w-1/4 flex flex-col items-center justify-start relative z-4 text-center rounded-xl p-[1vw]">
                <img src={`/bg_noise/${t.dp=='da'?'water-5':'water-5'}.png`} alt="" className="absolute z-2 h-full w-full object-cover rounded-xl"/>
                <div className="z-4 h-[60%] w-full flex items-start justify-center text-white rounded-xl text-[4vh] font-bold my-[2vh] relative">
                  <img src={`/team_dps/${t.dp}.png`} alt="" className="absolute z-3 h-full w-auto object-cover rounded-xl"/>
                </div>
                <div className="z-4 h-[15%] w-full flex items-center justify-center text-white text-[2vh] font-bold mb-[2vh]">{t.name}</div>
                <div className="z-4 h-[25%] w-full flex flex-col items-center justify-start text-white gap-[1vh]">
                  <span className="text-[1.54vh] font-semibold">{t.role}</span>
                  <span className="text-[1.27vh] font-medium">{t.desc}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="h-[10%] w-full flex items-center justify-center text-darker-green font-semibold text-[4vh] z-4"></div>
      </div>
    </>
  );
}
