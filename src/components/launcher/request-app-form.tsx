"use client"

import { useState, type FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { appRequestSchema, type AppRequest } from "@/lib/schemas/app"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FieldErrors = Partial<Record<keyof AppRequest, string[]>>

async function submitRequest(data: AppRequest) {
  const res = await fetch("/api/app-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Could not send your request")
  return res.json()
}

const fields: { name: keyof AppRequest; label: string; type?: string }[] = [
  { name: "name", label: "Your name" },
  { name: "email", label: "Work email", type: "email" },
  { name: "appName", label: "App you need" },
]

export function RequestAppForm() {
  const [errors, setErrors] = useState<FieldErrors>({})
  const mutation = useMutation({
    mutationFn: submitRequest,
    onSuccess: () => toast.success("Request sent. We will be in touch."),
    onError: (err) => toast.error(err.message),
  })

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const result = appRequestSchema.safeParse(Object.fromEntries(new FormData(form)))
    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors)
      return
    }
    setErrors({})
    mutation.mutate(result.data, { onSuccess: () => form.reset() })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request an app</CardTitle>
        <CardDescription>Missing something? Tell us what you need.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          {fields.map((f) => {
            const error = errors[f.name]?.[0]
            return (
              <div key={f.name} className="flex flex-col gap-1.5">
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input
                  id={f.name}
                  name={f.name}
                  type={f.type ?? "text"}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${f.name}-error` : undefined}
                />
                {error && (
                  <p id={`${f.name}-error`} className="text-destructive text-xs">
                    {error}
                  </p>
                )}
              </div>
            )
          })}
          <Button type="submit" disabled={mutation.isPending} className="self-start">
            {mutation.isPending ? "Sending..." : "Send request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
