import { Fragment } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ResumeFormValues } from '../data/schema'
import { resumeFormConfig, options } from '../data/config'
import { IconPlus, IconTrash } from '@tabler/icons-react'

export default function DynamicWorkExperience() {
  const form = useFormContext<ResumeFormValues>()
  const arraySection = resumeFormConfig.sections.find((s) => s.key === 'workExperience' && s.array)?.array

  const workExpArray = useFieldArray({ control: form.control, name: 'workExperience' })

  if (!arraySection) return null

  return (
    <div className='mb-10'>
      <div className='mb-6 flex items-center justify-between'>
        <h3 className='text-lg leading-none'>{arraySection.itemTitlePrefix ?? '工作经历'}</h3>
        <Button
          variant='outline'
          className='h-9 rounded-md px-3'
          type='button'
          onClick={() =>
            workExpArray.append({
              organization: '',
              title: '',
              startDate: '',
              endDate: '',
              city: '',
              employmentType: '',
              achievements: '',
            })
          }
        >
          <IconPlus className='h-4 w-4' /> {arraySection.addButtonText}
        </Button>
      </div>

      <div className='space-y-6'>
        {workExpArray.fields.length === 0 ? (
          <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
            <div className='text-center py-10 text-gray-500'>
              <span className='text-xs text-muted-foreground leading-none'>
                {arraySection.emptyText}
              </span>
            </div>
          </div>
        ) : (
          workExpArray.fields.map((fieldItem, index) => (
            <div key={fieldItem.id} className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
              <div className='mb-4 flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>{(arraySection.itemTitlePrefix ?? '工作经历') + ' ' + (index + 1)}</div>
                <Button
                  variant='ghost'
                  size='sm'
                  type='button'
                  onClick={() => workExpArray.remove(index)}
                  className='h-8 px-2 text-destructive'
                >
                  <IconTrash className='h-4 w-4' /> 删除
                </Button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {arraySection.itemFields.map((f) => (
                  <Fragment key={String(f.key)}>
                    <FormField
                      control={form.control}
                      name={`workExperience.${index}.${f.key}` as const}
                      render={({ field }) => (
                        <FormItem className={`space-y-2 ${f.colSpan === 2 ? 'md:col-span-2' : ''}`}>
                          <FormLabel>{f.label}</FormLabel>
                          {f.component === 'input' && (
                            <FormControl>
                              <Input placeholder={f.placeholder} {...field} />
                            </FormControl>
                          )}
                          {f.component === 'textarea' && (
                            <FormControl>
                              <Textarea rows={4} placeholder={f.placeholder} {...field} />
                            </FormControl>
                          )}
                          {f.component === 'select' && (
                            <Select onValueChange={field.onChange} value={(field.value as string) ?? undefined}>
                              <FormControl>
                                <SelectTrigger className='w-full h-9'>
                                  <SelectValue placeholder={f.placeholder} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(f.optionsKey ? options[f.optionsKey] : []).map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Fragment>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


