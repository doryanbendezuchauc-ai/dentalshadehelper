import React, { useState } from 'react';
import { Upload, Camera, RefreshCw, CheckCircle, AlertTriangle, X, Info, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HandWrittenTitle } from '@/components/ui/hand-writing-text';
import { GlassCard } from '@/components/ui/glass-card';

const API_BASE = '';

interface ImageData {
  url: string;
  base64: string;
  mimeType: string;
}

interface AnalysisResult {
  naturalShade: string;
  newShade: string;
  matchScore: number;
  analysis: string;
  verdict: string;
  recommendation: string;
}

/* ─── Animated Background ─── */
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    {/* Base gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#F2F2F7] via-[#E8ECF4] to-[#F5F5F7] dark:from-[#000000] dark:via-[#0A0A0F] dark:to-[#000000]" />
    
    {/* Floating orbs */}
    <div
      className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.07] dark:opacity-[0.04]"
      style={{
        background: 'radial-gradient(circle, #0071E3 0%, transparent 70%)',
        animation: 'float-orb 20s ease-in-out infinite',
      }}
    />
    <div
      className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.05] dark:opacity-[0.03]"
      style={{
        background: 'radial-gradient(circle, #34C759 0%, transparent 70%)',
        animation: 'float-orb-reverse 25s ease-in-out infinite',
      }}
    />
    <div
      className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-[0.04] dark:opacity-[0.02]"
      style={{
        background: 'radial-gradient(circle, #AF52DE 0%, transparent 70%)',
        animation: 'float-orb 18s ease-in-out infinite 3s',
      }}
    />

    {/* Grain overlay */}
    <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }}
    />
  </div>
);

/* ─── Skeleton Loader ─── */
const SkeletonLoader = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    className="relative rounded-[28px] overflow-hidden bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/30 dark:border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)] mt-8 p-8 md:p-10"
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent z-10" />
    
    <div className="flex items-center gap-6 mb-10">
      <div className="h-16 w-16 bg-[#F5F5F7]/80 dark:bg-white/[0.06] rounded-full animate-pulse" />
      <div className="space-y-3 flex-1">
        <div className="h-6 w-1/3 bg-[#F5F5F7]/80 dark:bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-4 w-1/4 bg-[#F5F5F7]/80 dark:bg-white/[0.08] rounded-md animate-pulse" />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-6 md:gap-10 mb-10">
      <div className="h-32 md:h-40 bg-[#F5F5F7]/80 dark:bg-white/[0.06] rounded-[20px] animate-pulse" />
      <div className="h-32 md:h-40 bg-[#F5F5F7]/80 dark:bg-white/[0.06] rounded-[20px] animate-pulse" />
    </div>

    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#E5E5EA] dark:via-white/10 to-transparent mb-10" />

    <div className="space-y-4 mb-8">
      <div className="h-6 w-1/4 bg-[#F5F5F7]/80 dark:bg-white/[0.06] rounded-lg animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-[#F5F5F7]/80 dark:bg-white/[0.06] rounded-md animate-pulse" />
        <div className="h-4 w-[90%] bg-[#F5F5F7]/80 dark:bg-white/[0.06] rounded-md animate-pulse" />
        <div className="h-4 w-[80%] bg-[#F5F5F7]/80 dark:bg-white/[0.06] rounded-md animate-pulse" />
      </div>
    </div>
  </motion.div>
);

/* ─── Upload Card ─── */
interface UploadCardProps {
  label: string;
  badge: string;
  image: ImageData | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  icon: React.ReactNode;
  hint: string;
  delay: number;
}

const UploadCard = ({ label, badge, image, onImageChange, onClear, icon, hint, delay }: UploadCardProps) => (
  <GlassCard delay={delay} className="p-6 sm:p-8 group/card">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">{label}</h2>
      <span className="px-3 py-1 bg-black/[0.03] dark:bg-white/[0.06] text-[#86868B] dark:text-[#A1A1A6] text-sm font-medium rounded-full backdrop-blur-sm">{badge}</span>
    </div>
    <div className="relative h-72 rounded-[20px] border-[1.5px] border-dashed border-[#D2D2D7]/60 dark:border-white/[0.08] bg-[#FBFBFD]/60 dark:bg-white/[0.02] group-hover/card:bg-[#F0F1F5]/60 dark:group-hover/card:bg-white/[0.04] group-hover/card:border-[#0071E3]/30 dark:group-hover/card:border-[#409CFF]/20 transition-all duration-500 overflow-hidden"
      style={{ animation: image ? 'none' : '' }}
    >
      {image ? (
        <>
          <img src={image.url} alt={label} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <button
            onClick={onClear}
            className="absolute top-4 right-4 p-2.5 bg-white/80 dark:bg-black/60 backdrop-blur-xl hover:bg-white dark:hover:bg-black text-[#1D1D1F] dark:text-white rounded-full shadow-sm transition-all duration-300 hover:scale-110 active:scale-95"
            aria-label="Remove image"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </>
      ) : (
        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-white/80 dark:bg-white/[0.08] backdrop-blur-md rounded-2xl shadow-sm mb-4 transition-shadow duration-500 group-hover/card:shadow-[0_4px_20px_rgba(0,113,227,0.15)]"
          >
            {icon}
          </motion.div>
          <span className="text-[15px] font-semibold text-[#1D1D1F] dark:text-white mb-1">Tap to capture</span>
          <span className="text-[13px] text-[#86868B] dark:text-[#A1A1A6] font-medium">{hint}</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onImageChange} />
        </label>
      )}
    </div>
  </GlassCard>
);

/* ─── Main App ─── */
export default function App() {
  const [naturalImage, setNaturalImage] = useState<ImageData | null>(null);
  const [newImage, setNewImage] = useState<ImageData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImage: (data: ImageData | null) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64 = result.split(',')[1];
      setImage({
        url: result,
        base64,
        mimeType: file.type
      });
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImages = async () => {
    if (!naturalImage || !newImage) return;

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naturalImage: { base64: naturalImage.base64, mimeType: naturalImage.mimeType },
          newImage: { base64: newImage.base64, mimeType: newImage.mimeType }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("You've reached the rate limit. Please wait 15 minutes before making another analysis.");
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }
      try {
        const parsedResult = JSON.parse(content) as AnalysisResult;
        setResult(parsedResult);
      } catch {
        throw new Error("AI returned an invalid response. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze images. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = naturalImage && newImage;
  const scoreColor = result
    ? result.matchScore >= 85 ? '#34C759' : result.matchScore >= 70 ? '#FF9500' : '#FF3B30'
    : '#0071E3';

  return (
    <>
      <AnimatedBackground />

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-[#1D1D1F] dark:text-white selection:bg-[#0071E3]/20">
        <div className="max-w-4xl mx-auto">

          {/* ─── Hero Header ─── */}
          <HandWrittenTitle
            title="Dental Shade Assistant"
            subtitle="AI‑powered shade matching for precision restorations"
          />

          {/* ─── Upload Grid ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 -mt-8">
            <UploadCard
              label="Natural Tooth"
              badge="Baseline"
              image={naturalImage}
              onImageChange={(e) => handleImageUpload(e, setNaturalImage)}
              onClear={() => setNaturalImage(null)}
              icon={<Camera className="w-7 h-7 text-[#0071E3] dark:text-[#409CFF]" />}
              hint="Clear, well-lit photo"
              delay={0.15}
            />
            <UploadCard
              label="Restoration"
              badge="New Tooth"
              image={newImage}
              onImageChange={(e) => handleImageUpload(e, setNewImage)}
              onClear={() => setNewImage(null)}
              icon={<Upload className="w-7 h-7 text-[#0071E3] dark:text-[#409CFF]" />}
              hint="Match baseline lighting"
              delay={0.25}
            />
          </div>

          {/* ─── CTA Button ─── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="flex justify-center pt-10 pb-4"
          >
            <motion.button
              onClick={analyzeImages}
              disabled={!canAnalyze || isAnalyzing}
              whileHover={canAnalyze && !isAnalyzing ? { scale: 1.03, y: -2 } : {}}
              whileTap={canAnalyze && !isAnalyzing ? { scale: 0.97 } : {}}
              className={`
                relative flex items-center justify-center px-10 py-4 rounded-[100px] text-[17px] font-semibold transition-all duration-300 overflow-hidden
                ${!canAnalyze
                  ? 'bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#636366] cursor-not-allowed backdrop-blur-md'
                  : isAnalyzing
                    ? 'bg-[#0071E3] text-white cursor-wait'
                    : 'bg-[#0071E3] text-white shadow-[0_8px_24px_rgba(0,113,227,0.3)] hover:shadow-[0_12px_36px_rgba(0,113,227,0.4)]'}
              `}
            >
              {/* Shimmer sweep on enabled button */}
              {canAnalyze && !isAnalyzing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer-sweep_3s_ease-in-out_infinite]" />
              )}

              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                  Processing Analysis...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2 opacity-80" strokeWidth={2} />
                  Compare Match
                  <ChevronRight className="w-5 h-5 ml-1 opacity-60" strokeWidth={2.5} />
                </>
              )}
            </motion.button>
          </motion.div>

          {/* ─── Error Message ─── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="bg-[#FF3B30]/5 dark:bg-[#FF453A]/10 border border-[#FF3B30]/15 dark:border-[#FF453A]/20 text-[#E30000] dark:text-[#FF6B6B] px-6 py-5 rounded-[20px] flex items-start backdrop-blur-xl"
              >
                <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
                <p className="font-medium text-[15px]">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Results ─── */}
          <AnimatePresence mode="wait">
            {isAnalyzing && <SkeletonLoader key="skeleton" />}

            {result && !isAnalyzing && (
              <motion.div
                key="result-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                className="relative rounded-[28px] overflow-hidden bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/30 dark:border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)] mt-8"
              >
                {/* Verdict Header */}
                <div
                  className="p-8 md:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
                  style={{
                    background: result.matchScore >= 85
                      ? 'linear-gradient(135deg, #34C759 0%, #30D158 50%, #28B744 100%)'
                      : result.matchScore >= 70
                        ? 'linear-gradient(135deg, #FF9500 0%, #FF8C00 50%, #E58600 100%)'
                        : 'linear-gradient(135deg, #FF3B30 0%, #FF453A 50%, #D22B21 100%)',
                  }}
                >
                  {/* Gloss overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/10 pointer-events-none" />
                  {/* Radial glow */}
                  <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/15 blur-3xl pointer-events-none" />

                  <div className="space-y-3 relative z-10">
                    <motion.h3
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="text-3xl font-bold tracking-tight text-white drop-shadow-sm"
                    >
                      {result.verdict}
                    </motion.h3>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
                      className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/15 backdrop-blur-md border border-white/15"
                    >
                      <span className="text-white font-medium text-[15px]">
                        Match Score <span className="font-bold text-lg ml-1">{result.matchScore}/100</span>
                      </span>
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, type: "spring", bounce: 0.4 }}
                    className="relative z-10 self-end md:self-auto"
                  >
                    {result.matchScore >= 85 ? (
                      <CheckCircle className="w-16 h-16 text-white drop-shadow-md" strokeWidth={1.5} />
                    ) : (
                      <AlertTriangle className="w-16 h-16 text-white drop-shadow-md" strokeWidth={1.5} />
                    )}
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-10 space-y-10">
                  {/* Shades Grid */}
                  <div className="grid grid-cols-2 gap-6 md:gap-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="bg-black/[0.02] dark:bg-white/[0.04] p-6 rounded-[20px] text-center border border-black/[0.04] dark:border-white/[0.06]"
                    >
                      <p className="text-[13px] text-[#86868B] dark:text-[#A1A1A6] font-semibold uppercase tracking-wider mb-2">Natural Shade</p>
                      <p className="text-5xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">{result.naturalShade}</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className="bg-black/[0.02] dark:bg-white/[0.04] p-6 rounded-[20px] text-center border border-black/[0.04] dark:border-white/[0.06]"
                    >
                      <p className="text-[13px] text-[#86868B] dark:text-[#A1A1A6] font-semibold uppercase tracking-wider mb-2">Restoration</p>
                      <p className="text-5xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">{result.newShade}</p>
                    </motion.div>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-[#E5E5EA]/50 dark:via-white/10 to-transparent" />

                  {/* Analysis */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="space-y-4"
                  >
                    <h4 className="flex items-center text-xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
                      <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 dark:bg-[#409CFF]/15 flex items-center justify-center mr-3">
                        <Info className="w-4 h-4 text-[#0071E3] dark:text-[#409CFF]" />
                      </div>
                      Detailed Analysis
                    </h4>
                    <p className="text-[#48484A] dark:text-[#C7C7CC] leading-relaxed text-[17px] pl-11">
                      {result.analysis}
                    </p>
                  </motion.div>

                  {/* Recommendation */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="space-y-4"
                  >
                    <h4 className="flex items-center text-xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
                      <div className="w-8 h-8 rounded-full bg-[#34C759]/10 dark:bg-[#30D158]/15 flex items-center justify-center mr-3">
                        <CheckCircle className="w-4 h-4 text-[#34C759] dark:text-[#30D158]" />
                      </div>
                      Recommendation
                    </h4>
                    <div className="bg-black/[0.02] dark:bg-white/[0.04] p-6 rounded-[20px] border border-black/[0.04] dark:border-white/[0.06]">
                      <p className="text-[#1D1D1F] dark:text-white leading-relaxed text-[17px] font-medium">
                        {result.recommendation}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Footer ─── */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="text-center py-12 text-[13px] text-[#86868B]/60 dark:text-[#A1A1A6]/40 font-medium"
          >
            Dental Shade Assistant · AI-powered analysis · For professional use only
          </motion.footer>

        </div>
      </div>
    </>
  );
}
