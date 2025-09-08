'use client'
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Alert from "../components/Alert";
import Loading from "../components/Loading";
import { useSession, signIn, signOut } from "next-auth/react";

import { Genos } from "next/font/google";
const gen = Genos({ subsets: ['latin'], weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] });

export default function Auth() {
  const { data: session, status } = useSession(); // Google Auth session
  const router = useRouter();
  const [message, setMessage] = useState<string|null>(null)
  const [redirecting, setRedirecting] = useState(false);
  const { user, isLoggedIn, loading: authLoading, setUser, setToken } = useAuth();
  const sessionLoading = status === "loading";
  const fullyLoaded = !authLoading && !sessionLoading;
  const isAuthenticated = isLoggedIn || status === "authenticated";

  // redirecting only after both systems are done loading
  useEffect(() => {
    if (fullyLoaded && isAuthenticated && !redirecting) {
      setRedirecting(true);
      setTimeout(() => {router.push('/dashboard');}, 1017);
    }
  }, [fullyLoaded, isAuthenticated, router, redirecting]);

  if (!fullyLoaded) return <Loading />;
  if (isAuthenticated) {
    return(
      <div className="z-2 relative h-[100vh] w-screen flex flex-col items-center justify-center">
        <Image className="z-1 object-cover object-center" src={`/landingpage_harvestborder/2.png`} alt="" fill/>
        <div className={`${gen.className} relative h-[77%] w-[77%] rounded-xl flex items-center justify-center`}>
          <img src={`/bg_noise/white.png`} alt="" className="absolute z-2 w-full h-full rounded-xl object-cover opacity-[0.81]"/>
          <Alert message="LoggedIn Succesfully. Redirecting..." ok={false}/>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        setMessage(null);

        // const formData = new FormData(e.currentTarget);
        const form = new FormData(e.currentTarget);
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
        form.append('action', submitter.value); // adding action manually
        const payload = new URLSearchParams();
        form.forEach((value, key) => {
            if (typeof value === 'string'){payload.append(key, value);}
        });
        const response = await fetch('http://localhost:3001/api/auth', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: payload.toString(),
        });
        const data = await response.json();
        setMessage(data.message?.[0] ?? 'Unexpected response');
        if (!response.ok) {
            setMessage(data.message?.join(' ') || 'Something went wrong');
            return;
        }
        setMessage(data.message?.join(' ') || 'Success');
        
        // store user and token
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setToken(data.token);
        // Login button sends credentials.
        // Backend responds with { user, token }.
        // You update context via setUser and setToken.
        // isLoggedIn becomes true, and authLoading is false.
        // Your useEffect() detects the change and redirects to /dashboard.

        // router.push('/dashboard');
    }

  return (
    <>
      <div className="z-2 relative h-[100vh] w-screen flex flex-col items-center justify-center">
        {/* <Image className="z-1 object-cover object-center" src={`/bg_noise/black.png`} alt="" fill/> */}
        <img src={`/bg_img/landingpage_parallax.png`} alt="" className="absolute z-2 w-full h-auto object-contain"/>
        <div className={`${gen.className} relative h-[77%] w-[77%] rounded-xl flex items-center justify-center`}>
          <img src={`/bg_noise/water-5.png`} alt="" className="absolute z-2 w-full h-full rounded-xl object-cover opacity-[0.81]"/>
          <div className="relative z-3 h-[77%] w-2/3 flex flex-col items-center justify-center rounded-xl border-r-1 border-water-1">
            <img src={`/bg_noise/water-1.png`} alt="" className="absolute z-2 w-[90%] h-full rounded-xl object-cover opacity-[0.54]"/>
            {/* <div className="relative z-3 h-[27%] w-full flex items-center justify-center"></div> */}
            <div className="relative z-3 h-full w-full flex flex-col items-center justify-center">
              
              <form onSubmit={handleSubmit} className="h-full w-full flex flex-col items-center justify-center">
                    <div className={`h-[30%] relative w-full flex items-center justify-center text-center text-white text-[3vh] font-bold`}>
                      <a href="/" className="h-auto relative w-auto flex items-center justify-center cursor-pointer hover:opacity-[0.77] border-r-1 mr-[4vh] border-white"><img src={`/logos/zenithvapourcast_nobg.png`} alt="" className="z-2 w-auto h-[12vh] mr-[2vw] rounded-xl object-contain"/></a>
                      <span>LogIn</span>
                    </div>
                    <div className="h-[40%] w-full flex flex-col items-center justify-center gap-[1vh] text-white font-bold text-[2vh]">
                      <input type="name" name="username" placeholder="Username" required className="h-[27%] w-[54%] p-2 border border-white rounded placeholder-white/55 focus:outline-none focus:ring-2 focus:ring-white focus:border-white" />
                      <input type="email" name="email" placeholder="Email" required className="h-[27%] w-[54%] p-2 border border-white rounded placeholder-white/55 focus:outline-none focus:ring-2 focus:ring-white focus:border-white" />
                      <input type="password" name="password" placeholder="Password" required className="h-[27%] w-[54%] p-2 border border-white rounded placeholder-white/55 focus:outline-none focus:ring-2 focus:ring-white focus:border-white" />
                    </div>
                    <div className="h-[30%] w-full flex items-center justify-center gap-[1vw]">
                      <motion.button type="submit" name="action" value="login" whileHover={{ scale: 1.054 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`w-auto h-auto flex items-center justify-center py-2 px-4 rounded-xl text-black font-bold cursor-pointer hover:opacity-[0.77] text-[2vh]`}
                        style={{backgroundImage: "url('/bg_noise/water-1.png')", backgroundSize: 'cover'}}
                      >LogIn</motion.button>
                      <motion.button type="submit" name="action" value="signup" whileHover={{ scale: 1.054 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`w-auto h-auto flex items-center justify-center py-2 px-4 rounded-xl text-black font-medium cursor-pointer hover:opacity-[0.77] text-[2vh]`}
                        style={{backgroundImage: "url('/bg_noise/white.png')", backgroundSize: 'cover'}}
                      >Not Registered? <span className="font-extrabold">&nbsp;Signup</span></motion.button>
                    </div>
                </form>
                {message && <Alert message={message} ok={true}/>}

            </div>
          </div>
          <div className={`${gen.className} relative z-3 h-[77%] text-[2vh] w-1/3 flex flex-col items-center justify-center gap-[1vh] text-water-1`}>
            <span>OR</span>
            {/* onClick={() => signIn('google', { callbackUrl: '/dashboard' })} */}
            <motion.button onClick={()=>{signIn('google');}} whileHover={{ scale: 1.054 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative z-3 h-[4vh] w-[77%] flex items-center justify-center gap-[1vw] text-white text-[2vh] font-bold rounded cursor-pointer opacity-[0.77]"
              style={{backgroundImage: "url('/bg_noise/water-1.png')", backgroundSize: 'cover'}}
              >
                <img src={`/logos/google.png`} alt="" className="w-auto h-[54%] object-contain"/>
                <span className="z-3 text-water-5 text-[2.17vh]">SignIn with Google</span>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}