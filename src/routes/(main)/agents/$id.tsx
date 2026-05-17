import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(main)/agents/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(main)/agents/$id"!</div>
}
