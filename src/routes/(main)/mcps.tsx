import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(main)/mcps')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(main)/mcps"!</div>
}
