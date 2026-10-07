import React, { useEffect, useRef } from 'react';

interface TacticalAudioVisualizerProps {
  active?: boolean;
  barCount?: number;
  color?: string;
  className?: string;
}

export const TacticalAudioVisualizer: React.FC<TacticalAudioVisualizerProps> = ({
  active = true,
  barCount = 18,
  color = '#38bdf8',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 2;
        if (active) {
          const wave = Math.sin(phase + i * 0.45) * 0.5 + 0.5;
          const noise = Math.sin(phase * 1.5 + i * 0.8) * 0.3;
          barHeight = Math.max(3, (wave + noise) * height * 0.85);
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = active ? color : '#334155';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      phase += 0.08;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [active, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={28}
      className={`inline-block ${className}`}
    />
  );
};
