import React, { useState, useEffect } from 'react';
import { Type, Sliders, Check, RotateCcw, X } from 'lucide-react';
import { type Language } from '../i18n';

export interface TypographySettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
}

const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontFamily: 'Noto Serif Bengali',
  fontSize: 18,
  lineHeight: 1.85,
  maxWidth: 760,
};

const FONTS = [
  { name: 'Noto Serif Bengali', label: 'নোটো সেরিফ (Noto Serif)', sample: 'শিল্পের ছোঁয়ায় প্রাণ পাক লেখা' },
  { name: 'Hind Siliguri', label: 'হিন্দ শিলিগুড়ি (Hind Siliguri)', sample: 'শিল্পের ছোঁয়ায় প্রাণ পাক লেখা' },
  { name: 'Tiro Bangla', label: 'তিরো বাংলা (Tiro Bangla)', sample: 'শিল্পের ছোঁয়ায় প্রাণ পাক লেখা' },
  { name: 'Noto Sans Bengali', label: 'নোটো সান্স (Noto Sans)', sample: 'শিল্পের ছোঁয়ায় প্রাণ পাক লেখা' },
  { name: 'Kalpurush', label: 'কালপুরুষ (Kalpurush)', sample: 'শিল্পের ছোঁয়ায় প্রাণ পাক লেখা' },
  { name: 'SolaimanLipi', label: 'সোলায়মান লিপি (SolaimanLipi)', sample: 'শিল্পের ছোঁয়ায় প্রাণ পাক লেখা' },
];

interface TypographyControlProps {
  lang: Language;
  onSettingsChange?: (settings: TypographySettings) => void;
}

export const TypographyControl: React.FC<TypographyControlProps> = ({ lang, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<TypographySettings>(() => {
    try {
      const saved = localStorage.getItem('lipishilpo_typography_config');
      return saved ? JSON.parse(saved) : DEFAULT_TYPOGRAPHY;
    } catch {
      return DEFAULT_TYPOGRAPHY;
    }
  });

  useEffect(() => {
    // Apply CSS variables to root and editor
    document.documentElement.style.setProperty('--editor-font-family', `"${settings.fontFamily}", 'Noto Sans Bengali', sans-serif`);
    document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
    document.documentElement.style.setProperty('--editor-line-height', `${settings.lineHeight}`);
    document.documentElement.style.setProperty('--editor-max-width', `${settings.maxWidth}px`);

    try {
      localStorage.setItem('lipishilpo_typography_config', JSON.stringify(settings));
    } catch {}

    if (onSettingsChange) onSettingsChange(settings);
  }, [settings, onSettingsChange]);

  function update(partial: Partial<TypographySettings>) {
    setSettings((prev) => ({ ...prev, ...partial }));
  }

  function handleReset() {
    setSettings(DEFAULT_TYPOGRAPHY);
  }

  return (
    <>
      <button
        type="button"
        className={'header-icon-btn ' + (isOpen ? 'active' : '')}
        onClick={() => setIsOpen(!isOpen)}
        title={lang === 'bn' ? 'টাইপোগ্রাফি ও ফন্ট সেটিংস (Aa)' : 'Typography & Font Settings (Aa)'}
      >
        <Type size={16} />
      </button>

      {isOpen && (
        <div className="typo-dropdown-panel" onClick={(e) => e.stopPropagation()}>
          <div className="typo-header">
            <span>{lang === 'bn' ? 'টাইপোগ্রাফি ও ফন্ট' : 'Typography & Font'}</span>
            <div className="typo-header-actions">
              <button type="button" onClick={handleReset} title="Reset" className="typo-reset-btn">
                <RotateCcw size={13} />
              </button>
              <button type="button" onClick={() => setIsOpen(false)} className="typo-close-btn">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Font Family Selector */}
          <div className="typo-section">
            <label>{lang === 'bn' ? 'পছন্দের বাংলা ফন্ট:' : 'Font Family:'}</label>
            <div className="font-options-list">
              {FONTS.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  className={'font-option-btn ' + (settings.fontFamily === f.name ? 'selected' : '')}
                  style={{ fontFamily: f.name }}
                  onClick={() => update({ fontFamily: f.name })}
                >
                  <span className="font-name">{f.label}</span>
                  {settings.fontFamily === f.name && <Check size={14} color="#20644f" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="typo-section">
            <div className="typo-label-row">
              <label>{lang === 'bn' ? 'ফন্ট সাইজ:' : 'Font Size:'}</label>
              <strong>{settings.fontSize}px</strong>
            </div>
            <input
              type="range"
              min="14"
              max="28"
              step="1"
              value={settings.fontSize}
              onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) })}
              className="typo-range-slider"
            />
          </div>

          {/* Line Height Slider */}
          <div className="typo-section">
            <div className="typo-label-row">
              <label>{lang === 'bn' ? 'লাইনের দূরত্ব (Line Height):' : 'Line Height:'}</label>
              <strong>{settings.lineHeight.toFixed(2)}</strong>
            </div>
            <input
              type="range"
              min="1.4"
              max="2.5"
              step="0.05"
              value={settings.lineHeight}
              onChange={(e) => update({ lineHeight: parseFloat(e.target.value) })}
              className="typo-range-slider"
            />
          </div>

          {/* Column Width */}
          <div className="typo-section">
            <div className="typo-label-row">
              <label>{lang === 'bn' ? 'পৃষ্ঠার প্রস্থ (Reading Width):' : 'Reading Width:'}</label>
              <strong>{settings.maxWidth}px</strong>
            </div>
            <div className="width-presets">
              {[620, 720, 820, 950].map((w) => (
                <button
                  key={w}
                  type="button"
                  className={'width-preset-btn ' + (settings.maxWidth === w ? 'active' : '')}
                  onClick={() => update({ maxWidth: w })}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
