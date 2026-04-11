import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "Que tipos de negocios pueden usar BookIA?",
    answer:
      "BookIA funciona para barberias, salones de belleza, spa y clinicas que necesiten reservas, gestion de clientes y operacion diaria en un solo lugar.",
  },
  {
    question: "Incluye recordatorios automaticos?",
    answer:
      "Si. Puedes activar recordatorios para reducir ausencias y mantener la agenda ordenada con menos trabajo manual.",
  },
  {
    question: "Necesito instalar algo en mi negocio?",
    answer:
      "No. BookIA funciona en web y se adapta a desktop y movil, por lo que tu equipo puede empezar sin instalaciones complejas.",
  },
  {
    question: "Puedo empezar con datos mock y ajustar luego?",
    answer:
      "Si. Puedes iniciar rapido con configuracion inicial y luego personalizar servicios, personal, horarios y automatizaciones.",
  },
]

export function FaqSection() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-sm md:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Preguntas frecuentes
        </h2>
        <p className="mt-2 text-muted-foreground">
          Todo lo necesario para evaluar BookIA antes de comenzar.
        </p>

        <Accordion type="single" collapsible className="mt-6 w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`item-${index + 1}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
