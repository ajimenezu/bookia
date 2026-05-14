"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, 
  Clock, 
  Tag, 
  User, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Save, 
  Loader2, 
  Trash2,
  Edit3,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible"
import { StatusBadge } from "./appointments/status-badge"
import { formatTime } from "@/lib/date-utils"
import { getAppointmentServicesName } from "@/lib/appointments"
import { cn } from "@/lib/utils"
import { addAppointmentNote, updateAppointmentNote, deleteAppointmentNote } from "@/app/schedule/actions"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface ClientAppointmentCardProps {
  appointment: any
  shopId: string
  onUpdate?: () => void
}

export function ClientAppointmentCard({ appointment, shopId, onUpdate }: ClientAppointmentCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isUpdatingNote, setIsUpdatingNote] = useState(false)
  
  // Optimistic UI state
  const [localNotes, setLocalNotes] = useState<any[]>(appointment.notes || [])

  // Sync local notes when appointment prop changes
  useEffect(() => {
    setLocalNotes(appointment.notes || [])
  }, [appointment.notes])

  const handleAddNote = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!newNote.trim()) return
    
    const content = newNote.trim()
    const tempId = `temp-${Date.now()}`
    const optimisticNote = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      author: { name: "Tú", email: "" },
      isOptimistic: true
    }

    // Optimistic Update
    setLocalNotes(prev => [optimisticNote, ...prev])
    setNewNote("")
    setIsAddingNote(true)

    try {
      const result = await addAppointmentNote({
        appointmentId: appointment.id,
        content,
        shopId
      })
      if (result.success) {
        toast.success("Nota agregada correctamente")
        onUpdate?.()
      } else {
        // Rollback
        setLocalNotes(prev => prev.filter(n => n.id !== tempId))
        setNewNote(content)
        toast.error(result.error || "Error al agregar nota")
      }
    } catch (error) {
      setLocalNotes(prev => prev.filter(n => n.id !== tempId))
      setNewNote(content)
      toast.error("Error de conexión")
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return
    
    const originalContent = localNotes.find(n => n.id === noteId)?.content
    const newContent = editContent.trim()

    // Optimistic Update
    setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: newContent } : n))
    setEditingNoteId(null)
    setIsUpdatingNote(true)

    try {
      const result = await updateAppointmentNote({
        noteId,
        content: newContent,
        shopId
      })
      if (result.success) {
        toast.success("Nota actualizada")
        onUpdate?.()
      } else {
        // Rollback
        setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: originalContent } : n))
        toast.error(result.error || "Error al actualizar nota")
      }
    } catch (error) {
      setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: originalContent } : n))
      toast.error("Error de conexión")
    } finally {
      setIsUpdatingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const originalNotes = [...localNotes]
    
    // Optimistic Update
    setLocalNotes(prev => prev.filter(n => n.id !== noteId))

    try {
      const result = await deleteAppointmentNote({ noteId, shopId })
      if (result.success) {
        toast.success("Nota eliminada")
        onUpdate?.()
      } else {
        // Rollback
        setLocalNotes(originalNotes)
        toast.error(result.error || "Error al eliminar nota")
      }
    } catch (error) {
      setLocalNotes(originalNotes)
      toast.error("Error de conexión")
    }
  }

  const startEdit = (note: any) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group glass-card rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-all bg-card/40 overflow-hidden"
    >
      <CollapsibleTrigger asChild>
        <div className="p-5 cursor-pointer select-none">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-base font-black">
                  {new Date(appointment.startTime).toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-bold text-muted-foreground">
                  {formatTime(appointment.startTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={appointment.status} className="px-3 py-1 text-[11px]" />
              {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border/20">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-secondary text-secondary-foreground">
                <Tag className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">
                  {getAppointmentServicesName(appointment)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-secondary text-secondary-foreground">
                <User className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Atendido por: <span className="text-foreground font-bold">{appointment.staff?.name || "Sin asignar"}</span>
              </p>
            </div>
          </div>
          
          {localNotes.length > 0 && !isOpen && (
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-primary/70">
              <MessageSquare className="h-3.5 w-3.5" />
              {localNotes.length} {localNotes.length === 1 ? "nota" : "notas"}
            </div>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t border-border/20 bg-primary/5 animate-in slide-in-from-top-2 duration-200">
        <div className="p-5 space-y-8">
          {/* Add Note Input (TOP) */}
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 text-primary" /> Agregar Nueva Nota
            </p>
            <textarea
              className="w-full min-h-[100px] rounded-2xl border border-border bg-background p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-sm"
              placeholder="Escribe algo importante sobre esta cita..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                onClick={handleAddNote}
                disabled={!newNote.trim() || isAddingNote}
              >
                {isAddingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Nota
              </Button>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Notes List (BOTTOM) */}
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-primary" /> Historial de Notas
            </p>
            
            {localNotes.length > 0 ? (
              <div className="space-y-4">
                {localNotes.map((note: any) => (
                  <div 
                    key={note.id} 
                    className={cn(
                      "bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/60 shadow-sm group/note transition-all",
                      note.isOptimistic && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                          {note.author?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {note.author?.name || "Usuario"}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                      </div>
                      {!note.isOptimistic && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => startEdit(note)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {editingNoteId === note.id ? (
                      <div className="space-y-3 mt-2">
                        <textarea
                          className="w-full min-h-[80px] rounded-xl border border-border bg-background p-3 text-base focus:ring-1 focus:ring-primary outline-none resize-none shadow-inner"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 px-4 text-xs font-bold rounded-lg"
                            onClick={() => setEditingNoteId(null)}
                          >
                            <X className="h-4 w-4 mr-2" /> Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="h-9 px-4 text-xs font-bold rounded-lg"
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={isUpdatingNote || !editContent.trim()}
                          >
                            {isUpdatingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Actualizar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base text-card-foreground leading-relaxed whitespace-pre-wrap font-medium">
                        {note.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-background/20 rounded-2xl border border-dashed border-border/40">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground font-medium italic">
                  No hay notas registradas para esta cita.
                </p>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
