import { Fragment } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ResumeFormValues } from '../data/schema'
import { resumeFormConfig, options } from '../data/config'

type Props = {
  sectionKey?: 'basic'
}

export default function DynamicBasicForm(_props: Props) {
  const form = useFormContext<ResumeFormValues>()
  const section = resumeFormConfig.sections.find((s) => s.key === 'basic')
  if (!section || !section.fields) return null

  type BasicFieldKey = 'name' | 'gender' | 'phone' | 'email' | 'city' | 'origin' | 'expectedSalary'

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
      {section.fields.map((field) => (
        <Fragment key={field.key as string}>
          <FormField<ResumeFormValues, BasicFieldKey>
            control={form.control}
            name={field.key as BasicFieldKey}
            render={({ field: rhfField }) => (
              <FormItem className='w-full space-y-2'>
                <FormLabel>{field.label}</FormLabel>
                {field.component === 'input' && (
                  <FormControl>
                    <Input placeholder={field.placeholder} disabled={field.disabled} value={(rhfField.value as string) ?? ''} onChange={rhfField.onChange} onBlur={rhfField.onBlur} name={rhfField.name} ref={rhfField.ref} />
                  </FormControl>
                )}
                {field.component === 'textarea' && (
                  <FormControl>
                    <Textarea rows={4} placeholder={field.placeholder} disabled={field.disabled} value={(rhfField.value as string) ?? ''} onChange={rhfField.onChange} onBlur={rhfField.onBlur} name={rhfField.name} ref={rhfField.ref} />
                  </FormControl>
                )}
                {field.component === 'select' && (
                  <Select onValueChange={rhfField.onChange} value={(rhfField.value as string) ?? undefined}>
                    <FormControl>
                      <SelectTrigger className='w-full h-9'>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(field.optionsKey ? options[field.optionsKey] : []).map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.hint ? (
                  <div className='flex items-center gap-1'>
                    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-3 w-3 text-muted-foreground'>
                      <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>
                      <path d='m9 11 3 3L22 4'></path>
                    </svg>
                    <span className='text-xs text-muted-foreground'>{field.hint}</span>
                  </div>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </Fragment>
      ))}
    </div>
  )
}


