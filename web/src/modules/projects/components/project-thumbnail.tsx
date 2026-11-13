import type { CSSProperties } from 'react'
import type { Project } from '@/types/project'

export function projectAccentStyle(
  mainColor: Project['mainColor'],
  shadowOffsetY: string
): CSSProperties | undefined {
  if (!mainColor) return undefined
  return {
    borderColor: `${mainColor}66`,
    boxShadow: `0 ${shadowOffsetY} 16px ${mainColor}40`,
  }
}

export function ProjectThumbnail({
  project,
  describeFallback = false,
}: {
  project: Pick<Project, 'projectName' | 'thumbnailUrl'>
  describeFallback?: boolean
}) {
  const alt = `Imagem do projeto ${project.projectName}`

  if (project.thumbnailUrl) {
    return (
      <img
        src={project.thumbnailUrl}
        alt={alt}
        className='aspect-video w-full rounded-lg object-cover'
      />
    )
  }

  const fallbackAlt = describeFallback ? alt : undefined
  return (
    <>
      <img src='/project-fallback-light.png' alt={fallbackAlt} className='rounded-lg dark:hidden' />
      <img
        src='/project-fallback-dark.png'
        alt={fallbackAlt}
        className='hidden rounded-lg dark:block'
      />
    </>
  )
}
