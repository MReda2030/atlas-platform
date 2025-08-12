'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-2 bg-[#5750F1]/10 rounded-full border border-[#5750F1]/20 text-sm font-medium text-[#5750F1] mb-4">
              ✨ Performance Marketing Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-gray-900 via-[#5750F1] to-gray-900 bg-clip-text text-transparent dark:from-white dark:via-[#8B7CF6] dark:to-white">
              Atlas Travel Platform
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-gray-600 md:text-xl dark:text-gray-300 leading-relaxed">
              Advanced analytics and campaign management for travel businesses across Gulf countries
            </p>
          </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3 w-full max-w-5xl">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">6</div>
                  <p className="text-sm text-blue-600/80 dark:text-blue-300/80 font-medium">Target Countries</p>
                  <p className="text-xs text-blue-500/70 dark:text-blue-400/70">Gulf Coverage</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">10</div>
                  <p className="text-sm text-emerald-600/80 dark:text-emerald-300/80 font-medium">Destinations</p>
                  <p className="text-xs text-emerald-500/70 dark:text-emerald-400/70">Travel Spots</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-[#5750F1] to-purple-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4z"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#5750F1] dark:text-purple-400">5</div>
                  <p className="text-sm text-purple-600/80 dark:text-purple-300/80 font-medium">Platforms</p>
                  <p className="text-xs text-purple-500/70 dark:text-purple-400/70">Ad Channels</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : user ? (
            // Authenticated users see dashboard access
            <Button size="lg" asChild className="bg-[#5750F1] hover:bg-[#4338CA]">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            // Unauthenticated users see Login and Register
            <>
              <Button size="lg" asChild className="bg-[#5750F1] hover:bg-[#4338CA]">
                <Link href="/auth/login">Login to Platform</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-[#5750F1] text-[#5750F1] hover:bg-[#5750F1] hover:text-white">
                <Link href="/auth/register">Register Account</Link>
              </Button>
            </>
          )}
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Media Campaign Tracking</CardTitle>
              <CardDescription>
                Track advertising spend across multiple platforms and countries
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>
                Monitor sales agent performance and conversion rates
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>ROI Analytics</CardTitle>
              <CardDescription>
                Calculate return on investment for campaigns and agents
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Multi-Country Reports</CardTitle>
              <CardDescription>
                Generate reports across UAE, KSA, Kuwait, Qatar, Bahrain, Oman
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Agent Management</CardTitle>
              <CardDescription>
                Manage 48+ sales agents across 4 branch locations
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quality Tracking</CardTitle>
              <CardDescription>
                5-tier quality rating system for performance evaluation
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
