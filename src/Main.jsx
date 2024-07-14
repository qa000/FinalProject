import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { Model } from './Model'; 
import LoadingScreen from './component/LodingScreen';
import './App.css';

export default function Main() {
    const [isLoading, setIsLoading] = useState(true);
    const [percentage, setPercentage] = useState(0);
    const [navigateToMain, setNavigateToMain] = useState(false);
  
    useEffect(() => {
      let timer;
      if (isLoading) {
        timer = setInterval(() => {
          setPercentage(prev => {
            if (prev < 100) {
              return prev + 1;
            } else {
              clearInterval(timer);
              setIsLoading(false);
              return 100;
            }
          });
        }, 30); // 30ms마다 1%씩 증가
      }
      return () => clearTimeout(timer);
    }, [isLoading]);
  
    const handleButtonClick = () => {
      setNavigateToMain(true);
      setIsLoading(true);
    };
  
    useEffect(() => {
      let timer;
      if (navigateToMain) {
        timer = setInterval(() => {
          setPercentage(prev => {
            if (prev < 100) {
              return prev + 1;
            } else {
              clearInterval(timer);
              window.location.href = '/main'; 
              return 100;
            }
          });
        }, 30); // 30ms마다 1%씩 증가
      }
      return () => clearTimeout(timer);
    }, [navigateToMain]);
  
    const { scale } = useSpring({
      scale: [1, 1, 1],
      from: { scale: [0, 0, 0] },
      config: { duration: 2000 }
    });
  
    return (
      <div className="canvas-container">
        {isLoading ? (
          <LoadingScreen percentage={percentage} />
        ) : (
          <>
            <Canvas 
              camera={{ position: [70, 25, -10] }}
            >
              <OrbitControls />
              <ambientLight intensity={1} />
              <directionalLight position={[5, 5, 5]} intensity={4} />
              <animated.group rotation-y={Math.PI / 2} scale={scale}>
                <Model />
              </animated.group>
            </Canvas>

            <button class="cta" onClick={handleButtonClick}>
            <span class="hover-underline-animation"> 발자국 따라가기</span>
            <svg id="arrow-horizontal" xmlns="http://www.w3.org/2000/svg"
             width="30" height="10" viewBox="0 0 46 16" >
            <path id="Path_10" data-name="Path 10" d="M8,0,6.545,1.455l5.506,5.506H-30V9.039H12.052L6.545,14.545,8,16l8-8Z" transform="translate(30)" ></path>
          </svg>
          </button>
          </>
        )}
      </div>
    );
  }
  