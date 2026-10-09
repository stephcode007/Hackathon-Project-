// "Add to calendar": builds a .ics file in the browser and downloads it
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function downloadIcs({ id, title, location, start, end }) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stacks//Library//EN',
    'BEGIN:VEVENT',
    `UID:${id}@stacks`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(new Date(start))}`,
    `DTEND:${stamp(new Date(end))}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/\W+/g, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
