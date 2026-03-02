"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function HackIIIT() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cursor & Glow Logic
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    const glow = glowRef.current;

    if (!cursor || !follower || !glow) return;

    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      cursor.style.left = mouseX + "px";
      cursor.style.top = mouseY + "px";

      glow.style.left = mouseX + "px";
      glow.style.top = mouseY + "px";
    };

    const animateFollower = () => {
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      follower.style.left = followerX + "px";
      follower.style.top = followerY + "px";
      requestAnimationFrame(animateFollower);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animateFollower();

    // Hover interactions
    const hoverElements = document.querySelectorAll(
      ".hover-target, a, .timeline-item, .logo-wrapper",
    );
    hoverElements.forEach((el) => {
      el.addEventListener("mouseenter", () =>
        follower?.classList.add("cursor-hover"),
      );
      el.addEventListener("mouseleave", () =>
        follower?.classList.remove("cursor-hover"),
      );
    });

    // Reveal Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.style.opacity = "1";
            target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    // Smooth Scroll Navigation
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach((anchor) => {
      anchor.addEventListener(
        "click",
        function (this: HTMLAnchorElement, e: Event) {
          (e as MouseEvent).preventDefault();
          const target = document.querySelector(this.getAttribute("href")!);
          if (target) {
            target.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        },
      );
    });

    // Scroll to Top Button
    const scrollTopBtn = document.getElementById("scroll-top");
    const handleScroll = () => {
      if (window.pageYOffset > 500) {
        scrollTopBtn?.classList.add("visible");
      } else {
        scrollTopBtn?.classList.remove("visible");
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        /* ---- Swipe-in primitives ---- */
        .reveal-swipe-left {
          opacity: 0;
          transform: translateX(-40px);
        }

        .reveal-swipe-right {
          opacity: 0;
          transform: translateX(40px);
        }

        .reveal-swipe-up {
          opacity: 0;
          transform: translateY(30px);
        }

        .reveal-active {
          opacity: 1;
          transform: translate(0, 0);
          transition:
            opacity 0.8s ease,
            transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        :root {
          --black: #000000;
          --blue: #0d1164;
          --purple: #640d5f;
          --pink: #ea2264;
          --peach: #f78d60;
          --glass: rgba(255, 255, 255, 0.03);
          --border: rgba(255, 255, 255, 0.1);
        }

        * {
          cursor: none;
        }

        body {
          font-family: "Plus Jakarta Sans", sans-serif;
          background: var(--black);
          color: #fff;
        }

        // img {
        //   max-width: 400px;
        //   height: auto;
        // }

        #cursor {
          width: 8px;
          height: 8px;
          background: var(--peach);
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 10001;
          transform: translate(-50%, -50%);
        }

        #cursor-follower {
          width: 30px;
          height: 30px;
          border: 1px solid var(--pink);
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 10000;
          transform: translate(-50%, -50%);
          transition:
            width 0.3s,
            height 0.3s,
            background 0.3s,
            border 0.3s;
        }

        .cursor-hover {
          width: 80px !important;
          height: 80px !important;
          background: rgba(234, 34, 100, 0.1) !important;
          border: 1px solid var(--peach) !important;
        }

        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(100, 13, 95, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 13, 95, 0.15) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 0;
          pointer-events: none;
        }

        .ambient-glow {
          position: fixed;
          width: 60vmax;
          height: 60vmax;
          background: radial-gradient(
            circle,
            rgba(100, 13, 95, 0.3) 0%,
            transparent 70%
          );
          top: 0;
          left: 0;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 1;
        }

        #scroll-top {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 50px;
          height: 50px;
          background: var(--pink);
          border: 2px solid var(--border);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          pointer-events: none;
          transition:
            opacity 0.3s,
            transform 0.3s;
          font-size: 1.5rem;
          color: white;
        }

        #scroll-top.visible {
          opacity: 1;
          pointer-events: auto;
        }

        #scroll-top:hover {
          background: var(--purple);
          transform: translateY(-5px);
          box-shadow: 0 5px 20px var(--purple);
        }

        .section {
          min-height: 100vh;
          padding: 120px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 10;
        }

        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .hero-title {
          font-family: "Press Start 2P", cursive;
          font-size: clamp(2rem, 8vw, 5rem);
          margin-bottom: 20px;
          color: #fff;
          text-shadow: 4px 4px var(--purple);
          text-align: center;
          line-height: 1.2;
        }

        .glow-letter {
          display: inline-block;
          transition: all 0.2s ease;
        }

        .glow-letter:hover {
          color: #ffd1fdff;
          text-shadow:
            0 0 10px var(--pink),
            0 0 20px var(--peach);
        }

        .btn-cta {
          background: var(--pink);
          color: white;
          padding: 16px 40px;
          border-radius: 4px;
          text-decoration: none;
          font-family: "Space Mono", monospace;
          font-weight: bold;
          transition: 0.3s;
          display: inline-block;
          border: none;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 20px;
        }

        .btn-cta:hover {
          background: var(--purple);
          box-shadow: 0 0 30px var(--purple);
          transform: translateY(-3px);
        }

        .hero-graphic {
          position: absolute;
          left: 25%;
          top: 55%;
          transform: translateY(-50%);
          width: 50%;
          opacity: 0.1;
          z-index: -1;
        }

        .glass-box {
          border: 11px solid var(--border);
          padding: 60px;
          border-radius: 30px;
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 50px;
          align-items: center;
        }

        .carousel-container {
          overflow: hidden;
          width: 100%;
          padding: 40px 0;
        }

        .carousel-track {
          display: flex;
          gap: 20px;
          width: fit-content;
          animation: scroll 30s linear infinite;
        }

        .carousel-img {
          width: 350px;
          height: 220px;
          object-fit: cover;
          border-radius: 15px;
          border: 1px solid var(--border);
          transition: 0.4s;
          filter: grayscale(1);
          flex-shrink: 0;
        }

        .carousel-img:hover {
          filter: grayscale(0);
          border-color: var(--pink);
          transform: scale(1.05);
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-350px * 4 - 80px));
          }
        }

        .timeline-item {
          padding: 40px;
          border-left: 2px solid var(--purple);
          margin-left: 20px;
          position: relative;
          transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .timeline-item:hover {
          border-left: 8px solid var(--pink);
          padding-left: 60px;
          background: linear-gradient(
            90deg,
            rgba(100, 13, 95, 0.2),
            transparent
          );
        }

        .timeline-item::after {
          content: "";
          position: absolute;
          left: -6px;
          top: 50px;
          width: 10px;
          height: 10px;
          background: var(--purple);
          border-radius: 50%;
          transition: 0.3s;
        }

        .timeline-item:hover::after {
          background: var(--pink);
          box-shadow: 0 0 15px var(--pink);
          transform: scale(1.5);
        }

        .faq-item {
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 20px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .faq-item:hover {
          border-color: var(--pink);
          background: rgba(234, 34, 100, 0.05);
          transform: translateX(10px);
        }

        .faq-question {
          font-family: "Space Mono", monospace;
          font-size: clamp(1rem, 2vw, 1.1rem);
          color: var(--pink);
          margin-bottom: 15px;
        }

        .faq-answer {
          color: #ccc;
          font-size: clamp(0.9rem, 2vw, 1rem);
          line-height: 1.8;
        }

        .footer-logo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 40px;
          align-items: center;
          justify-items: center;
          padding: 60px 0;
        }

        .logo-wrapper {
          transition: 0.4s;
          filter: grayscale(1) brightness(1.5);
          opacity: 0.6;
        }

        .logo-wrapper:hover {
          transform: scale(1.1);
          filter: grayscale(0) brightness(1);
          opacity: 1;
        }

        .logo-img {
          height: 50px;
          width: auto;
          object-fit: contain;
          max-width: 100%;
        }

        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition:
            opacity 1s,
            transform 1s;
        }

        @media (max-width: 1024px) {
          .section {
            padding: 100px 20px;
          }
          .glass-box {
            grid-template-columns: 1fr;
            padding: 40px;
            gap: 30px;
          }
          .carousel-img {
            width: 680px;
            height: 480px;
          }
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-280px * 4 - 80px));
            }
          }
        }

        @media (max-width: 768px) {
          #cursor,
          #cursor-follower {
            display: none;
          }
          * {
            cursor: auto;
          }
          #scroll-top {
            width: 45px;
            height: 45px;
            bottom: 20px;
            right: 20px;
          }
          .btn-cta {
            padding: 12px 24px;
            font-size: 0.8rem;
            letter-spacing: 1px;
          }
          .section {
            min-height: 100vh;
            padding: 80px 15px;
          }
          .hero-title {
            font-size: clamp(1.5rem, 10vw, 2.5rem);
            text-shadow: 2px 2px var(--purple);
          }
          .hero-graphic {
            position: absolute;
            left: 50%;
            top: 65%;
            transform: translate(-50%, -180%);
            width: 140%;
            opacity: 0.26;
            filter: blur(1px);
            pointer-events: none;
            z-index: -1;
          }
          .glass-box {
            padding: 30px 20px;
            border-width: 6px;
            border-radius: 20px;
            gap: 20px;
          }
          .glass-box h2 {
            font-size: 0.9rem !important;
          }
          .glass-box p {
            font-size: 1rem !important;
          }
          .carousel-img {
            width: 550px;
            height: 360px;
          }
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-250px * 4 - 80px));
            }
          }
          .timeline-item {
            padding: 25px 20px;
            margin-left: 10px;
          }
          .timeline-item:hover {
            padding-left: 30px;
          }
          .timeline-item h3 {
            font-size: 1rem;
          }
          .timeline-item p {
            font-size: 0.85rem;
          }
          .footer-logo-grid {
            grid-template-columns: repeat(2, 1fr); /* 2 columns */
            grid-template-rows: repeat(2, auto); /* 2 rows */
            gap: 23px;
            padding: 40px 0;
          }
          .logo-img {
            height: 40px;
          }
          .grid-overlay {
            background-size: 30px 30px;
          }
        }

        @media (max-width: 480px) {
          .btn-cta {
            padding: 10px 20px;
            font-size: 0.7rem;
          }
          .section {
            padding: 60px 10px;
          }
          .hero-title {
            margin-bottom: 15px;
          }
          .glass-box {
            padding: 20px 15px;
            border-width: 4px;
            border-radius: 15px;
          }
          .carousel-img {
            width: 400px;
            height: 330px;
          }
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-200px * 4 - 80px));
            }
          }
          .timeline-item {
            padding: 20px 15px;
          }
          .footer-logo-grid {
            grid-template-columns: repeat(2, 1fr); /* 2 columns */
            grid-template-rows: repeat(2, auto); /* 2 rows */
            gap: 25px;
          }
        }

        .section.compact {
          min-height: auto;
          padding: 80px 20px;
        }

        @media (max-width: 768px) {
          .section.compact {
            padding: 60px 15px;
          }
        }

        @media (min-width: 1440px) {
          .container {
            max-width: 1400px;
          }
          .carousel-img {
            width: 600px;
            height: 450px;
          }
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-400px * 4 - 80px));
            }
          }
        }

        @media (max-width: 768px) {
          .ambient-glow {
            animation: floatGlow 28s ease-in-out infinite alternate;
            background: radial-gradient(
              circle,
              rgba(200, 13, 95, 0.3) 0%,
              transparent 70%
            );
          }

          @keyframes floatGlow {
            0% {
              transform: translate(-45%, -50%) scale(1);
            }

            12% {
              transform: translate(10%, -30%) scale(1.1);
            }

            27% {
              transform: translate(40%, 15%) scale(0.95);
            }

            41% {
              transform: translate(-20%, 45%) scale(1.15);
            }

            56% {
              transform: translate(-55%, 100%) scale(0.9);
            }

            68% {
              transform: translate(25%, -45%) scale(1.08);
            }

            82% {
              transform: translate(50%, 35%) scale(0.92);
            }

            100% {
              transform: translate(-35%, -40%) scale(1.05);
            }
          }
        }

        /* Winner Cards Section Styles */
        .winner-card {
          background: var(--glass);
          border: 2px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 60px;
          backdrop-filter: blur(10px);
          transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .winner-card:hover {
          border-color: var(--pink);
          transform: translateY(-5px);
          box-shadow: 0 10px 40px rgba(234, 34, 100, 0.3);
        }

        .winner-card.first {
          border-color: var(--peach);
          background: rgba(247, 141, 96, 0.05);
        }

        .winner-card.first:hover {
          border-color: var(--peach);
          box-shadow: 0 10px 40px rgba(247, 141, 96, 0.4);
        }

        .winner-image-placeholder {
          width: 100%;
          height: 500px;
          background: linear-gradient(
            135deg,
            rgba(100, 13, 95, 0.3),
            rgba(234, 34, 100, 0.2)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-family: "Space Mono";
          font-size: 1.3rem;
          border-bottom: 2px solid var(--border);
          overflow: hidden;
          position: relative;
        }

        .winner-image-placeholder img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          top: 0;
          left: 0;
        }

        .winner-content {
          padding: 50px 45px;
        }

        .winner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .winner-rank-badge {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .winner-medal {
          font-size: 4rem;
        }

        .winner-rank-text {
          font-family: "Press Start 2P";
          font-size: 1.8rem;
          color: var(--pink);
        }

        .winner-card.first .winner-rank-text {
          color: var(--peach);
        }

        .winner-prize {
          font-family: "Space Mono";
          font-size: 2.5rem;
          font-weight: bold;
          color: #fff;
        }

        .winner-team-name {
          font-family: "Press Start 2P";
          font-size: clamp(1.4rem, 3vw, 2.2rem);
          color: #fff;
          margin-bottom: 20px;
        }

        .winner-description {
          color: #ccc;
          font-size: 1.2rem;
          line-height: 1.9;
          margin-bottom: 25px;
        }

        .winner-tech {
          color: #888;
          font-family: "Space Mono";
          font-size: 1rem;
        }

        /* Mentor Awards Section */
        .mentor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 40px;
          margin-top: 40px;
        }

        .mentor-card {
          background: var(--glass);
          border: 2px solid var(--border);
          border-radius: 25px;
          padding: 50px 40px;
          text-align: center;
          transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          backdrop-filter: blur(10px);
        }

        .mentor-card:hover {
          border-color: var(--purple);
          transform: translateY(-8px);
          background: rgba(100, 13, 95, 0.2);
          box-shadow: 0 10px 40px rgba(100, 13, 95, 0.3);
        }

        .mentor-icon {
          font-size: 5rem;
          margin-bottom: 25px;
        }

        .mentor-image {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto 25px;
          border: 4px solid var(--border);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        }

        .mentor-card:hover .mentor-image {
          border-color: var(--purple);
          box-shadow: 0 8px 30px rgba(100, 13, 95, 0.5);
          transform: scale(1.05);
        }

        .mentor-name {
          font-family: "Space Mono";
          color: #fff;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 12px;
        }

        .mentor-prize {
          font-family: "Space Mono";
          color: var(--peach);
          font-weight: bold;
          font-size: 1.8rem;
          margin-bottom: 12px;
        }

        .mentor-description {
          color: #aaa;
          font-size: 1.05rem;
          line-height: 1.7;
        }

        @media (max-width: 768px) {
          .winner-image-placeholder {
            height: 300px;
            font-size: 0.9rem;
          }

          .winner-content {
            padding: 35px 30px;
          }

          .winner-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .winner-medal {
            font-size: 2.5rem;
          }

          .winner-rank-text {
            font-size: 1.2rem;
          }

          .winner-prize {
            font-size: 1.8rem;
          }

          .winner-description {
            font-size: 1rem;
          }

          .winner-tech {
            font-size: 0.9rem;
          }

          .mentor-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Prizes Section Styles */
        .prize-grid {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 60px;
          flex-wrap: wrap;
        }

        .prize-card {
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 40px 20px;
          text-align: center;
          width: 280px;
          position: relative;
          backdrop-filter: blur(10px);
          transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .prize-card:hover {
          transform: translateY(-10px);
          border-color: var(--pink);
          background: rgba(234, 34, 100, 0.1);
          box-shadow: 0 10px 30px rgba(234, 34, 100, 0.2);
        }

        .prize-card.first {
          height: 380px;
          border-color: var(--peach);
          background: rgba(247, 141, 96, 0.05);
          order: 2;
          z-index: 2;
        }

        .prize-card.first:hover {
          border-color: var(--peach);
          background: rgba(247, 141, 96, 0.15);
          box-shadow: 0 10px 40px rgba(247, 141, 96, 0.3);
        }

        .prize-card.second {
          height: 320px;
          order: 1;
        }

        .prize-card.third {
          height: 300px;
          order: 3;
        }

        .prize-rank {
          font-family: "Press Start 2P";
          font-size: 2rem;
          margin-bottom: 20px;
          color: #fff;
          opacity: 0.8;
        }

        .prize-card.first .prize-rank {
          color: var(--peach);
        }

        .prize-amount {
          font-family: "Space Mono";
          font-size: 1.8rem;
          font-weight: bold;
          color: #fff;
          margin-bottom: 10px;
        }

        .prize-label {
          font-family: "Space Mono";
          color: #888;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .prize-crown {
          font-size: 3rem;
          margin-bottom: 15px;
          animation: float 3s ease-in-out infinite;
          display: block;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .awards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
          margin-top: 40px;
        }

        .award-item {
          background: var(--glass);
          border: 2px solid var(--border);
          border-radius: 20px;
          padding: 50px 35px;
          text-align: center;
          transition: 0.3s;
          backdrop-filter: blur(5px);
        }

        .award-item:hover {
          border-color: var(--purple);
          transform: translateY(-5px);
          background: rgba(100, 13, 95, 0.15);
        }

        .award-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .award-icon {
          font-size: 4rem;
        }

        .award-image-wrapper {
          width: 120px;
          height: 120px;
          border-radius: 15px;
          overflow: hidden;
          border: 2px solid var(--border);
          background: var(--glass);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.3s;
        }

        .award-item:hover .award-image-wrapper {
          border-color: var(--purple);
        }

        .award-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .award-amount {
          font-family: "Space Mono";
          color: var(--peach);
          font-weight: bold;
          font-size: 1.6rem;
          margin-bottom: 10px;
        }

        .award-title {
          color: #fff;
          font-size: 1.15rem;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .award-desc {
          font-size: 0.95rem;
          color: #999;
          margin-top: 8px;
          font-family: "Plus Jakarta Sans", sans-serif;
          line-height: 1.7;
        }

        @media (max-width: 1024px) {
          .prize-grid {
            gap: 15px;
          }
          .prize-card {
            min-width: 260px;
          }
        }

        @media (max-width: 900px) {
          .award-desc {
            font-size: 0.85rem;
            color: #999;
            margin-top: 10px;
            font-family: "Plus Jakarta Sans", sans-serif;
            line-height: 1.6;
          }

          .award-header {
            gap: 15px;
          }

          .award-image-wrapper {
            width: 80px;
            height: 80px;
          }

          .award-icon {
            font-size: 3rem;
          }

          .prize-grid {
            flex-direction: column;
            align-items: center;
            gap: 30px;
          }

          .prize-card {
            width: 100%;
            max-width: 450px;
            height: auto !important;
            order: unset !important;
            padding: 30px 20px;
            display: grid;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
            text-align: left;
            align-items: center;
            column-gap: 20px;
          }

          .prize-card.first {
            order: -1 !important;
            grid-template-rows: auto auto auto;
          }

          .prize-rank {
            grid-row: 1 / 3;
            margin-bottom: 0;
            font-size: 1.5rem;
          }

          .prize-amount {
            grid-column: 2;
            grid-row: 1;
            font-size: 1.4rem;
            margin-bottom: 5px;
          }

          .prize-label {
            grid-column: 2;
            grid-row: 2;
            font-size: 0.8rem;
          }

          .prize-crown {
            grid-column: 1 / 3;
            grid-row: 1;
            font-size: 2rem;
            margin-bottom: 10px;
            text-align: center;
            width: 100%;
          }
        }

        /* Better Approach for Mobile Awards: Keep grid but center content or allow 2 cols on slightly larger mobile */
        @media (max-width: 480px) {
          .prize-card {
            grid-template-columns: 1fr;
            text-align: center;
            justify-items: center;
            gap: 10px;
          }

          .prize-rank,
          .prize-rank,
          .prize-amount,
          .prize-label {
            grid-column: auto;
            grid-row: auto;
          }

          .prize-crown {
            grid-column: auto;
            margin-bottom: 5px;
          }

          .awards-grid {
            grid-template-columns: 1fr;
          }

          .award-image-placeholder {
            height: 200px;
            font-size: 0.8rem;
          }

          .award-content {
            padding: 30px 25px;
          }

          .award-header {
            flex-direction: column;
            gap: 15px;
          }

          .award-icon {
            font-size: 2.5rem;
          }

          .award-image-wrapper {
            width: 100px;
            height: 100px;
          }

          .award-amount {
            font-size: 1.4rem;
          }

          .award-title {
            font-size: 1.05rem;
          }

          .award-desc {
            font-size: 0.85rem;
            line-height: 1.6;
          }

          .mentor-grid {
            grid-template-columns: 1fr;
          }

          .mentor-card {
            padding: 35px 30px;
          }

          .mentor-icon {
            font-size: 3.5rem;
          }

          .mentor-image {
            width: 120px;
            height: 120px;
          }

          .mentor-name {
            font-size: 1.2rem;
          }

          .mentor-prize {
            font-size: 1.5rem;
          }

          .mentor-description {
            font-size: 0.95rem;
          }
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;700&family=Space+Mono:wght@400;700&family=Press+Start+2P&display=swap"
        rel="stylesheet"
      />
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;700&family=Space+Mono:wght@400;700&family=Press+Start+2P&display=swap');
            `}</style>

      <div ref={cursorRef} id="cursor"></div>
      <div ref={followerRef} id="cursor-follower"></div>
      <div className="grid-overlay"></div>
      <div ref={glowRef} className="ambient-glow" id="glow"></div>

      {/* Hero */}
      <section className="section" id="hero">
        <Image
          src="/hackiiit/beige-hackintosh-nobg.png"
          className="hero-graphic"
          alt=""
          width={500}
          height={500}
        />
        <div className="container" style={{ textAlign: "center" }}>
          <p
            className="reveal"
            style={{
              color: "var(--pink)",
              fontFamily: "Space Mono",
              letterSpacing: "6px",
              marginBottom: "15px",
              fontSize: "clamp(0.7rem, 2vw, 1rem)",
            }}
          >
            [ HALL_OF_FAME ]
          </p>
          <h1 className="hero-title reveal">
            {"HACKIIIT".split("").map((char, index) => (
              <span key={index} className="glow-letter">
                {char}
              </span>
            ))}
          </h1>
          <p
            className="reveal"
            style={{
              fontSize: "clamp(1rem, 3vw, 1.3rem)",
              color: "#888",
              fontFamily: "Space Mono",
              marginBottom: "10px",
            }}
          >
            CELEBRATING_OUR_CHAMPIONS
          </p>
          <p
            className="reveal"
            style={{
              color: "var(--peach)",
              fontFamily: "Space Mono",
              fontWeight: "bold",
              fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
            }}
          >
            JAN 24-26, 2026 • ₹1,00,000 PRIZE POOL
          </p>
          <button
            className="btn-cta"
            onClick={() =>
              (window.location.href =
                "https://gist.github.com/bropal404/926edc4320cbd137e65fa5e284c3a260")
            }
          >
            Have a look at all submissions here
          </button>
        </div>
      </section>

      {/*
      <section className="section compact" id="memories">
        <div className="container">
          <h2
            className="reveal"
            style={{
              fontFamily: "Press Start 2P",
              fontSize: "clamp(0.7rem, 2vw, 1rem)",
              textAlign: "center",
              marginBottom: "50px",
            }}
          >
            MEMORIES_HACKIIIT_2026
          </h2>
          <div className="carousel-container reveal">
            <div className="carousel-track">
              {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                <Image
                  key={num}
                  className="carousel-img"
                  src={`/hackiiit/carousel${num}.JPG`}
                  alt={`Carousel ${num}`}
                  width={350}
                  height={220}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
        */}

      {/* Winners Section */}
      <section className="section" id="winners">
        <div className="container" style={{ maxWidth: "1000px" }}>
          <h2
            className="reveal"
            style={{
              fontFamily: "Space Mono",
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
              margin: "0 0 80px",
              color: "#e4c66bff",
              textAlign: "center",
              letterSpacing: "4px",
            }}
          >
            [HALL_OF_FAME_2026]
          </h2>

          {/* 1st Place Winner */}
          <div className="winner-card first reveal hover-target">
            <div className="winner-image-placeholder">
              <Image
                src="/hackiiit/1st.png"
                alt="1st Place"
                width={350}
                height={220}
              />
            </div>
            <div className="winner-content">
              <div className="winner-header">
                <div className="winner-rank-badge">
                  <span className="winner-medal">🥇</span>
                  <span className="winner-rank-text">1ST PLACE</span>
                </div>
                <div className="winner-prize">₹40,000</div>
              </div>
              <h3 className="winner-team-name">Nuxe Nalc</h3>
              <p className="winner-description">
                Created a system to convert institute policy into a formal
                system, where users query if actions are allowed; an SMT solver
                verifies statements with the rules in the policy, with a
                proof/disproof of your "theorem" (action) using the "axioms"
                (policies). It can also find mathematically proven
                loopholes/contradictions in policies.
              </p>
              <p className="winner-tech">
                Vishesh Saraswat, Tejas Agarwal, Pratyush Vempati, Anirudh
                Vempati
              </p>
            </div>
          </div>

          {/* 2nd Place Winner */}
          <div className="winner-card reveal hover-target">
            <div className="winner-image-placeholder">
              <Image
                src="/hackiiit/2nd.png"
                alt="2nd Place"
                width={350}
                height={220}
              />
            </div>
            <div className="winner-content">
              <div className="winner-header">
                <div className="winner-rank-badge">
                  <span className="winner-medal">🥈</span>
                  <span className="winner-rank-text">2ND PLACE</span>
                </div>
                <div className="winner-prize">₹25,000</div>
              </div>
              <h3 className="winner-team-name">Gommies</h3>
              <p className="winner-description">
                ResearchWeb is a unified platform enhancing student, professor
                and research centre collaboration through a version-controlled
                website editor, a project connection board, and ML-powered
                semantic research matching. It simplifies content updates,
                improves project discovery, and intelligently connects students
                with relevant labs, faculty, and publications.
              </p>
              <p className="winner-tech">
                Dhruva Anand, Teja Pudie, Ayaansh Solanki, Jonathan Robin
              </p>
            </div>
          </div>

          {/* 3rd Place Winner */}
          <div className="winner-card reveal hover-target">
            <div className="winner-image-placeholder">
              <Image
                src="/hackiiit/3rd.png"
                alt="3rd Place"
                width={350}
                height={220}
              />
            </div>
            <div className="winner-content">
              <div className="winner-header">
                <div className="winner-rank-badge">
                  <span className="winner-medal">🥉</span>
                  <span className="winner-rank-text">3RD PLACE</span>
                </div>
                <div className="winner-prize">₹15,000</div>
              </div>
              <h3 className="winner-team-name">Another Useless Group</h3>
              <p className="winner-description">
                Hadron - "Where Ideas Collide" An AI-powered social hub that
                turns dense papers into snackable slide-stories, conversational
                podcasts and crisp reels (aka brainrot for the fast-paced
                crowd). FastAPI backend, React frontend, open models-driven
                summaries, TTS podcasts, vibrant lab communities with threads
                and open discussions so that students read, listen, learn,
                connect and innovate across domains.
              </p>
              <p className="winner-tech">
                Inesh Dheer, Shreyas Mehta, Aviral Gupta, Mohit Singh.
              </p>
            </div>
          </div>

          {/* Special Awards Section */}
          <h3
            className="reveal"
            style={{
              fontFamily: "Space Mono",
              fontSize: "clamp(1rem, 2vw, 1.5rem)",
              margin: "100px 0 50px",
              color: "#fff",
              textAlign: "center",
              letterSpacing: "4px",
            }}
          >
            [ SPECIAL_AWARDS ]
          </h3>

          <div className="awards-grid reveal">
            <div className="award-item hover-target">
              <div className="award-content">
                <div className="award-header">
                  <div className="award-icon">🎨</div>
                </div>
                <div className="award-amount">₹5,000</div>
                <div className="award-title">Team ACE - MOST_CREATIVE</div>
                <div className="award-desc">
                  NoGradeDrop Never miss a biometric again.NoGradeDrop is a
                  community-driven, AI-powered attendance notification ecosystem
                  designed to save your grades and your sleep. We combine
                  computer vision, crowdsourcing, and aggressive alarm systems
                  to ensure that when the biometric machine enters the class,
                  you are the first to know.
                </div>
              </div>
            </div>
            <div className="award-item hover-target">
              <div className="award-content">
                <div className="award-header">
                  <div className="award-icon">✨</div>
                </div>
                <div className="award-amount">₹5,000</div>
                <div className="award-title">odomos - BEST_UI/UX</div>
                <div className="award-desc">
                  UniGraph unifies your university experience. Use the
                  Playground to explore a stunning, interactive graph connecting
                  courses, topics, and resources. Switch to the Bureaucrat for
                  instant, accurate answers on any campus policyâ€”from hostels
                  to academicsâ€”featuring an intelligent agent that auto-drafts
                  official emails to the exact relevant authority.
                </div>
              </div>
            </div>
            <div className="award-item hover-target">
              <div className="award-content">
                <div className="award-header">
                  <div className="award-icon">🎁</div>
                </div>
                <div className="award-amount">₹5,000</div>
                <div className="award-title">MEGALODON - MOST_IMPACTFUL</div>
                <div className="award-desc">
                  SmartMess is an intelligent mess management system for IIIT
                  Hyderabad that reduces overcrowding through real-time crowd
                  monitoring. It features a meal marketplace and data-driven
                  analytics, helping users choose optimal messes and meal times
                  while improving overall mess efficiency and transparency. By
                  enabling meal redistribution and better demand prediction, it
                  also helps reduce food wastage in messes.
                </div>
              </div>
            </div>
          </div>

          {/* Special Awards Section */}
          <h3
            className="reveal"
            style={{
              fontFamily: "Space Mono",
              fontSize: "clamp(1rem, 2vw, 1.5rem)",
              margin: "100px 0 50px",
              color: "#fff",
              textAlign: "center",
              letterSpacing: "4px",
            }}
          >
            [ SPECIAL_MENTION ]
          </h3>

          <div className="awards-grid reveal">
            <div className="award-item hover-target">
              <div className="award-content">
                <div className="award-header">
                  <div className="award-icon">🎁</div>
                </div>
                <div className="award-title">
                  Santas And Their Elves - BEST_HARDWARE
                </div>
                <div className="award-desc">
                  Campus canteens have unpredictable availability and long wait
                  times. Students waste trips and time. Our MVP combines a
                  physical ON/OFF switch for real-time canteen status with
                  app-based pre-ordering. Orders are accepted only when open,
                  prepared in advance, and picked up instantly, reducing
                  confusion, waiting, and crowding
                </div>
              </div>
            </div>
          </div>

          {/* Best Mentor Awards */}
          <h3
            className="reveal"
            style={{
              fontFamily: "Space Mono",
              fontSize: "clamp(1rem, 2vw, 1.5rem)",
              margin: "100px 0 50px",
              color: "#fff",
              textAlign: "center",
              letterSpacing: "4px",
            }}
          >
            [BEST_MENTORS_AWARDS]
          </h3>

          <div className="mentor-grid reveal">
            <div className="mentor-card hover-target">
              <Image
                src="/hackiiit/advait.jpg"
                alt="Advait Dintakurti"
                width={150}
                height={150}
                className="mentor-image"
              />
              <div className="mentor-name">Advait Dintakurti</div>
            </div>
            <div className="mentor-card hover-target">
              <Image
                src="/hackiiit/kaushik.jpg"
                alt="Kaushik Yadla"
                width={150}
                height={150}
                className="mentor-image"
              />
              <div className="mentor-name">Kaushik Yadla</div>
            </div>
          </div>
        </div>
      </section>

      {/* Jane Street Spotlight */}
      <section className="section compact">
        <div className="container" style={{ textAlign: "center" }}>
          <h2
            className="reveal"
            style={{
              fontFamily: "Press Start 2P",
              fontSize: "clamp(0.7rem, 2vw, 1rem)",
              textAlign: "center",
              marginBottom: "50px",
            }}
          >
            POWERED BY
          </h2>
          <Image
            src="/hackiiit/jane_street_logo.png"
            alt="Jane Street"
            width={500}
            height={200}
            style={{
              display: "block",
              margin: "0 auto 30px",
              maxHeight: "200px",
              width: "auto",
              maxWidth: "90%",
            }}
          />

          <p
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              fontSize: "clamp(1rem, 2vw, 1.1rem)",
              lineHeight: "1.8",
              padding: "0 20px",
            }}
          >
            Jane Street works differently. We are a quantitative trading firm
            active on more than 200 trading venues across 45 countries. As a
            liquidity provider and market maker, we help form the backbone of
            global markets. Our approach is rooted in technology and rigorous
            quantitative analysis, but our success is driven by our people.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "100px 20px",
          borderTop: "1px solid var(--border)",
          background: "#000",
        }}
      >
        <div className="container">
          <div className="footer-logo-grid">
            <div className="logo-wrapper reveal">
              <Image
                src="/hackiiit/OSDG-logo.png"
                alt="OSDG"
                className="logo-img"
                width={150}
                height={50}
              />
            </div>
            <div className="logo-wrapper reveal">
              <Image
                src="/hackiiit/jane_street_logo_stacked.png"
                alt="Jane Street"
                className="logo-img"
                width={150}
                height={50}
              />
            </div>
            <div className="logo-wrapper reveal">
              <Image
                src="/hackiiit/iiit-logo.png"
                alt="IIIT"
                className="logo-img"
                width={150}
                height={50}
              />
            </div>
            <div className="logo-wrapper reveal">
              <Image
                src="/hackiiit/sponsor_2.png"
                alt="Sponsor"
                className="logo-img"
                width={150}
                height={50}
              />
            </div>
          </div>
          <p
            style={{
              textAlign: "center",
              fontFamily: "Space Mono",
              color: "#fff",
              fontSize: "clamp(0.7rem, 1.5vw, 0.8rem)",
              marginTop: "50px",
            }}
          >
            Copyright (c) 2026 OSDG. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        id="scroll-top"
        className="hover-target"
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>
    </>
  );
}
