import emptyStar from '@/assets/images/empty-start.svg'
import filledStar from '@/assets/images/full-start.svg'

interface RatingStarsProps {
  value: number
  hoverValue: number
  onChange: (value: number) => void
  onHoverChange: (value: number) => void
  ariaLabelPrefix?: string
  className?: string
}

export function RatingStars({
  value,
  hoverValue,
  onChange,
  onHoverChange,
  ariaLabelPrefix = '评分',
  className = 'gap-[10px]',
}: RatingStarsProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1
        const filled = (hoverValue || value) >= starValue
        return (
          <button
            key={starValue}
            type='button'
            aria-label={`${ariaLabelPrefix} ${starValue}`}
            onMouseEnter={() => onHoverChange(starValue)}
            onMouseLeave={() => onHoverChange(0)}
            onClick={() => onChange(starValue)}
            className='transition-transform hover:scale-105'
          >
            <img
              src={filled ? filledStar : emptyStar}
              alt={filled ? 'filled-star' : 'empty-star'}
              className='h-8 w-8'
            />
          </button>
        )
      })}
    </div>
  )
}

