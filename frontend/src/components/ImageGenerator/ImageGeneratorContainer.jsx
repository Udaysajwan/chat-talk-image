import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Maximize2,
  Copy,
  Check,
  AlertCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
} from 'lucide-react';
import { generateImage } from '../../services/api';

const INSPIRATION_PROMPTS = [
  'A futuristic AI communication hub in Bengaluru at sunset, cinematic lighting, ultra-detailed',
  'A majestic golden retriever sitting gracefully in a sunlit classical library, 8k photography',
  'Traditional Indian festival celebration with glowing diyas and festive marigold flowers, vibrant digital art',
  'Minimalist 3D isometric voice agent waveform floating in sleek glass studio, modern violet and teal accents',
];

export default function ImageGeneratorContainer() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux-2-klein-9b');
  const [size, setSize] = useState('1024x1024');
  const [count, setCount] = useState(1);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [seed, setSeed] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await generateImage({
        prompt: prompt.trim(),
        model,
        size,
        n: count,
        negative_prompt: negativePrompt.trim() || null,
        seed: seed || null,
      });

      const newImages = (response.data || []).map((img, i) => {
        let src = '';
        if (img.b64_json) {
          if (img.b64_json.startsWith('PHN2Zy') || img.mime_type?.includes('svg')) {
            src = `data:image/svg+xml;base64,${img.b64_json}`;
          } else {
            src = `data:image/png;base64,${img.b64_json}`;
          }
        } else if (img.url) {
          src = img.url;
        }

        return {
          id: `${Date.now()}-${i}`,
          src,
          prompt: prompt.trim(),
          model: response.model || model,
          size,
          created: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      });

      setGeneratedImages((prev) => [...newImages, ...prev]);
    } catch (err) {
      console.error('Image generation error:', err);
      setErrorMessage(err.message || 'Failed to generate image with CallMissed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (img) => {
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `callmissed-image-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyPrompt = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Prompt Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">CallMissed Image Studio</h2>
              <p className="text-[11px] text-slate-500">OpenAI-compatible /v1/images/generations endpoint</p>
            </div>
          </div>

          {/* Animated Options Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
              showAdvanced
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            <span>Generation Options</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleGenerate()}
              className="flex items-center gap-1 font-semibold text-rose-700 hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate in rich detail..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Inspiration Prompts with Hover Animation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="text-[11px] text-slate-500 font-medium shrink-0">Try:</span>
            <div className="flex gap-2">
              {INSPIRATION_PROMPTS.map((insp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(insp)}
                  className="text-xs whitespace-nowrap px-3 py-1 rounded-full bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200/80 transition-all duration-150 transform hover:-translate-y-0.5 shadow-2xs font-medium"
                >
                  {insp.slice(0, 42)}...
                </button>
              ))}
            </div>
          </div>

          {/* Animated Options Accordion */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Image Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                >
                  <option value="flux-2-klein-9b">flux-2-klein-9b (High Fidelity)</option>
                  <option value="sdxl-lightning">sdxl-lightning (Fast Generation)</option>
                  <option value="lucid-origin">lucid-origin (Cinematic)</option>
                  <option value="phoenix-1.0">phoenix-1.0 (Photorealistic)</option>
                  <option value="flux-2-dev">flux-2-dev (Hero Imagery)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dimensions</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                >
                  <option value="1024x1024">1024 x 1024 (Square 1:1)</option>
                  <option value="768x768">768 x 768</option>
                  <option value="512x512">512 x 512</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Image Count</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                >
                  <option value={1}>1 image</option>
                  <option value={2}>2 images</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Seed (Optional)</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">Negative Prompt</label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="e.g. blurry, distorted, low quality, artifacting"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Format: Base64 PNG • Billed per generated image
            </span>
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Rendering Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Artwork</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Gallery Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Generated Gallery</h3>
          <span className="text-xs text-slate-500 font-medium">
            {generatedImages.length} {generatedImages.length === 1 ? 'image' : 'images'}
          </span>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-square bg-slate-100 border border-slate-200 rounded-2xl animate-pulse flex flex-col items-center justify-center p-6 text-center"
              >
                <Sparkles className="w-8 h-8 text-teal-500/60 animate-spin mb-3" />
                <p className="text-xs font-semibold text-slate-700">Synthesizing image pixels...</p>
                <p className="text-[10px] text-slate-400 mt-1">Invoking CallMissed {model}</p>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && generatedImages.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-2xs">
            <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">No images generated yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Enter a text prompt above and click "Generate Artwork" to render visuals with CallMissed.
            </p>
          </div>
        )}

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {generatedImages.map((img) => (
            <div
              key={img.id}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                <img
                  src={img.src}
                  alt={img.prompt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Overlay actions on hover */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                  <button
                    onClick={() => setLightboxImage(img)}
                    className="p-2.5 rounded-full bg-white text-slate-800 hover:bg-slate-100 transition-colors shadow-md"
                    title="Zoom Image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(img)}
                    className="p-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-teal-600 text-white hover:opacity-90 transition-opacity shadow-md"
                    title="Download PNG"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-4">
                <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed font-medium" title={img.prompt}>
                  "{img.prompt}"
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-[10px] text-teal-700 font-semibold">{img.model}</span>
                  <div className="flex items-center gap-2">
                    <span>{img.size}</span>
                    <span>•</span>
                    <span>{img.created}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-4xl w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-4 flex items-center justify-center max-h-[70vh] bg-slate-950">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.prompt}
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>

            <div className="p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-slate-800 font-medium">"{lightboxImage.prompt}"</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>Model: {lightboxImage.model}</span>
                  <span>•</span>
                  <span>Dimensions: {lightboxImage.size}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyPrompt(lightboxImage.prompt)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold border border-slate-200"
                >
                  {copiedPrompt ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPrompt ? 'Copied' : 'Copy Prompt'}</span>
                </button>
                <button
                  onClick={() => handleDownload(lightboxImage)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
