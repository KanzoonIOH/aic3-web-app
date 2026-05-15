import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(main)/members')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(main)/members"!</div>
}
