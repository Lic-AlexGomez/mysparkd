'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layers, Moon, Ticket, Users, Radio, MessageSquare, Heart, Sparkles } from 'lucide-react'
import { useUnreadChats } from '@/hooks/use-unread-chats'
import { useAuth } from '@/lib/auth-context'

// SVG coordinate space
const SVG_W = 900
const SVG_H = 116   // bar height in SVG units
const PEAK_Y = -44 // mountain peak y in SVG units (above bar top)

export function SparkdDock() {
  const pathname = usePathname()
  const unreadChats = useUnreadChats()
  const { user } = useAuth()

  if (pathname.startsWith('/chat/')) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const text = user?.username || user?.nombres || 'Username'

  const svgPath = "M 48 0 L 365 0 C 385 0, 417.5 -28, 450 -28 C 482.5 -28, 515 0, 535 0 L 852 0 Q 900 0 900 58 L 900 116 Q 900 116 852 116 L 48 116 Q 0 116 0 58 L 0 0 Q 0 0 48 0 Z"

  return (
    <div className="fixed bottom-11 left-1/2 -translate-x-1/2 z-50 hidden lg:block mb-5" style={{ filter: 'drop-shadow(0 0 1px rgba(0,229,255,0.8)) drop-shadow(0 0 3px rgba(139,92,246,0.5))' }}>
      {/* Wrapper: exact SVG_W wide, overflow visible so peak shows above */}
      <div style={{ position: 'relative', width: SVG_W, overflow: 'visible' }}>

        {/* ── BACKDROP BLUR layer behind SVG ── */}
        <div style={{
          position: 'absolute', inset: 0, top: 54,
          backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          zIndex: 0, pointerEvents: 'none',
        }} />

        {/* ── SVG DOCK SHAPE — exact 900×96 matching viewBox ── */}
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ display: 'block', overflow: 'visible', position: 'relative', zIndex: 1 }}
        >
          <defs>
            <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.45)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <g transform="translate(0, 54)">
            <path d={svgPath} fill="rgba(10,11,15,0.82)" />
            <path d={svgPath} fill="none" stroke="rgba(0,229,255,0.35)" strokeWidth="1" />
          </g>
        </svg>

        {/* ── THE PULSE — absolute, centered, at peak height ── */}
        {/* Peak is at y=-44 in original coords = y=0 after translate(0,44), 
            which is 44px above the SVG top edge = -44px from SVG top */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 10,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(0,229,255,0.85)',
            textShadow: '0 0 8px rgba(0,229,255,0.7)',
            marginBottom: 4,
            display: 'block',
          }}>LIVE CITY ACTIVE</span>

          <style>{`
            @keyframes heartbeat {
              0%   { transform: scale(1); }
              14%  { transform: scale(1.15); }
              28%  { transform: scale(1); }
              42%  { transform: scale(1.1); }
              70%  { transform: scale(1); }
              100% { transform: scale(1); }
            }
            .pulse-heartbeat { animation: heartbeat 1.4s ease-in-out infinite; }
          `}</style>
          <Link href="/pulse" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            {/* Ring 1 */}
            <div className="pulse-heartbeat" style={{marginTop:20,  width: 96, height: 96, borderRadius: '50%', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Ring 2 */}
              <div style={{ width: 74, height: 74, borderRadius: '50%', border: '1px solid rgba(249,115,22,0.45)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Core */}
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  border: '2.5px solid #f97316',
                  background: 'linear-gradient(145deg, #f97316 0%, #dc2626 100%)',
                  boxShadow: '0 0 30px rgba(249,115,22,0.8), 0 0 60px rgba(234,88,12,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  filter: 'drop-shadow(0 0 15px rgba(249,115,22,0.8))',
                }}>
                  <Radio size={22} color="white" />
                </div>
              </div>
            </div>
            <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
              THE PULSE
            </span>
          </Link>
        </div>

        {/* ── NAV ITEMS — overlaid on the bar ── */}
        <div style={{
          position: 'absolute',
          top: 54, // offset matches the translate(0,54) on SVG
          left: 0,
          right: 0,
          height: SVG_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 44px',
          zIndex: 10,
        }}>
          <NavItem href="/feed"    icon={<Layers size={26} />}       label="FEED"    isActive={isActive('/feed')} />
          <NavItem href="/tonight" icon={<Moon size={26} />}         label="TONIGHT" isActive={isActive('/tonight')} />

          {/* EVENTS */}
          <Link href="/events" className="group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: '#00e5ff',
              boxShadow: '0 0 40px rgba(0,229,255,0.5), 0 0 80px rgba(139,92,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }} className="group-hover:scale-110">
              <Ticket size={23} color="black" />
            </div>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>EVENTS</span>
          </Link>

          <NavItem href="/groups" icon={<Users size={26} />} label="GROUPS" isActive={isActive('/groups')} />

          {/* Spacer: arch spans x=365 to x=535 = 170px */}
          <div style={{ width: 130, flexShrink: 0 }} />

          <NavItem href="/matches" icon={<Sparkles size={26} />} label="MATCHES" isActive={isActive('/matches')} />
          <NavItem href="/chat" icon={<MessageSquare size={26} />} label="CHAT" isActive={isActive('/chat')} hasNotification={unreadChats > 0} />
          <NavItem href="/swipes" icon={<Heart size={26} />} label="SWIPES" isActive={isActive('/swipes')} />

          {/* PROFILE */}
          <Link href="/profile" className="group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            
          <img
              src={user?.profilePictureUrl || user?.photos?.[0]?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(text)}&background=0d9488&color=fff&size=80`}
              alt="Profile"
              style={{
                width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 0 12px rgba(255,255,255,0.15)',
                opacity: 0.85, transition: 'opacity 0.2s, box-shadow 0.2s',
              }}
              className="group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>PROFILE</span>
              <span className="text-slate-500 font-medium" style={{ fontSize: 9 }}>{text}</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function NavItem({ href, icon, label, isActive, hasNotification }: {
  href: string; icon: React.ReactNode; label: string; isActive: boolean; hasNotification?: boolean
}) {
  return (
    <Link href={href} className="group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        position: 'relative',
        color: isActive ? '#fff' : 'rgba(255,255,255,0.38)',
        transition: 'color 0.2s, transform 0.2s',
      }} className="group-hover:text-white group-hover:scale-110">
        {icon}
        {hasNotification && (
          <span style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, background: '#ef4444', borderRadius: '50%', border: '2px solid #0b0b16' }} />
        )}
      </div>
      <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', transition: 'color 0.2s' }} className="group-hover:text-white">
        {label}
      </span>
    </Link>
  )
}
