'use client';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

function StarIcon({ filled, half, className }: { filled: boolean; half?: boolean; className: string }) {
  if (half) {
    return (
      <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill="url(#halfStar)"
          stroke="currentColor"
          strokeWidth="0.5"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const cls = sizeClasses[size];

  return (
    <div className="inline-flex items-center gap-0.5">
      {stars.map((star) => {
        const filled = value >= star;
        const half = !filled && value >= star - 0.5;

        if (readonly) {
          return (
            <span key={star} className="text-yellow-400">
              <StarIcon filled={filled} half={half} className={cls} />
            </span>
          );
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="text-yellow-400 transition-transform hover:scale-110"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <StarIcon filled={filled} className={cls} />
          </button>
        );
      })}
    </div>
  );
}
