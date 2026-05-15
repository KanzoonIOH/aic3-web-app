import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(main)/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(main)/dashboard"!</div>
}
