interface HeartbeatRuleProps {
  color?: string
  className?: string
}

/**
 * A looping ECG-style line used as a signature structural motif across the
 * app — in the hero, as section dividers, and as the "processing" animation
 * during a scan. Purely decorative SVG, duplicated once so the CSS animation
 * in index.css (.pulse-rule) can scroll it seamlessly.
 */
export function HeartbeatRule({ color = 'var(--color-coral)', className = '' }: HeartbeatRuleProps) {
  const segment =
    'M0 20 L40 20 L52 20 L58 4 L66 36 L74 8 L80 20 L92 20 L400 20'

  return (
    <div className={`pulse-rule ${className}`} aria-hidden="true">
      <svg viewBox="0 0 800 40" preserveAspectRatio="none">
        <path d={segment} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path
          d={segment}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          transform="translate(400, 0)"
        />
      </svg>
    </div>
  )
}
