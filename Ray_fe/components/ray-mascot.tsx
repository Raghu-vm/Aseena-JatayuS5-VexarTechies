import Image from 'next/image'

interface RayMascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  role?: 'admin' | 'executive' | 'employee'
  imageSrc?: string
}

const sizeMap = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 200,
}

const imageByRole = {
  admin: '/ray-admin.png',
  executive: '/ray-executive.png',
  employee: '/ray-robot.png',
}

export function RayMascot({ size = 'md', className = '', role = 'employee', imageSrc }: RayMascotProps) {
  const dimension = sizeMap[size]
  const src = imageSrc ?? imageByRole[role] ?? '/ray-robot.png'

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={src}
        alt={`RAY chatbot ${role}`}
        width={dimension}
        height={dimension}
        priority
        className="rounded-none"
        style={{ backgroundClip: 'padding-box' }}
      />
    </div>
  )
}
