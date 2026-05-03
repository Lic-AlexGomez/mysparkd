"use client"

import React, { useEffect, useState } from 'react'

// Simple admin conversations inspection page
export default function AdminMessagesPage() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchConversations() {
      try {
        const res = await fetch('/api/admin/conversations/inspect')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (mounted) setConversations(data)
      } catch (e) {
        if (mounted) setError('Error al cargar conversaciones')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchConversations()
    return () => { mounted = false }
  }, [])

  return (
    <section className="p-4">
      <h1 className="text-xl font-semibold mb-4">Mensajes — Inspección</h1>
      {loading && <div>Cargando conversaciones...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && conversations.length === 0 && (
        <div className="text-sm text-muted">Sin datos de inspección disponibles.</div>
      )}
      {conversations.length > 0 && (
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Participantes</th>
              <th className="px-4 py-2">Último mensaje</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c, idx) => (
              <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-2 break-words">{c.id ?? idx}</td>
                <td className="px-4 py-2">{(c.participants ?? []).join(', ')}</td>
                <td className="px-4 py-2">{c.lastMessage ?? ''}</td>
                <td className="px-4 py-2">{c.status ?? 'unknown'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
