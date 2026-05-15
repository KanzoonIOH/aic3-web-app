import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(main)/knowledges')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(main)/knowledges"!</div>
}
