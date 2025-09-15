import { Fragment } from 'react'
import type React from 'react'
import { useFormContext, useFieldArray, type FieldArrayPath, type FieldPath } from 'react-hook-form'
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
import { SelectDropdown } from '@/components/select-dropdown'
import { MonthPicker } from '@/components/month-picker'
import type { ResumeFormValues } from '../data/schema'
import { resumeFormConfig, options } from '../data/config'
import { IconPlus, IconTrash } from '@tabler/icons-react'

type SectionKey =
  | 'workExperience'
  | 'projectExperience'
  | 'education'
  | 'workSkills'
  | 'awards'
  | 'publications'
  | 'repositories'
  | 'patents'
  | 'socialMedia'

type Props = { sectionKey?: SectionKey; scrollContainerRef?: React.RefObject<HTMLElement | null>; readOnly?: boolean }

export default function DynamicWorkExperience({ sectionKey = 'workExperience' as SectionKey, scrollContainerRef: _scrollContainerRef, readOnly = false }: Props) {
  const form = useFormContext<ResumeFormValues>()
  const arraySection = resumeFormConfig.sections.find((s) => s.key === sectionKey && s.array)?.array
  const name: FieldArrayPath<ResumeFormValues> = (arraySection?.name ?? 'workExperience') as FieldArrayPath<ResumeFormValues>
  const fieldArray = useFieldArray<ResumeFormValues, FieldArrayPath<ResumeFormValues>>({ control: form.control, name })

  if (!arraySection) return null

  return (
    <div className='mb-10'>
      <div className='mb-6 flex items-center justify-between'>
        <h3 className='text-lg leading-none'>{arraySection.itemTitlePrefix ?? '工作经历'}</h3>
        {!readOnly && (
          <Button
            variant='outline'
            className='h-9 rounded-md px-3'
            type='button'
            onClick={() => {
              const emptyItem = arraySection.itemFields.reduce<Record<string, string | undefined>>((acc, f) => {
                acc[String(f.key)] = f.component === 'select' ? undefined : ''
                return acc
              }, {})
              const shouldPrepend = sectionKey === 'workExperience' || sectionKey === 'projectExperience'
              if (shouldPrepend) {
                fieldArray.prepend(emptyItem as unknown as Parameters<typeof fieldArray.prepend>[0])
              } else {
                fieldArray.append(emptyItem as unknown as Parameters<typeof fieldArray.append>[0])
              }
            }}
          >
            <IconPlus className='h-4 w-4' /> {arraySection.addButtonText}
          </Button>
        )}
      </div>

      <div className='space-y-6'>
        {fieldArray.fields.length === 0 ? (
          <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
            <div className='text-center py-10 text-gray-500'>
              <span className='text-xs text-muted-foreground leading-none'>
                {arraySection.emptyText}
              </span>
            </div>
          </div>
        ) : (
          fieldArray.fields.map((fieldItem, index) => (
            <div key={fieldItem.id} className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
              <div className='mb-4 flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>{(arraySection.itemTitlePrefix ?? '工作经历') + ' ' + (index + 1)}</div>
                {!readOnly && !(sectionKey === 'education' && index === 0) && (
                  <Button
                    variant='ghost'
                    size='sm'
                    type='button'
                    onClick={() => fieldArray.remove(index)}
                    className='h-8 px-2 text-destructive'
                  >
                    <IconTrash className='h-4 w-4' /> 删除
                  </Button>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {arraySection.itemFields.map((f) => (
                  <Fragment key={String(f.key)}>
                    <FormField
                      control={form.control}
                      name={`${arraySection.name}.${index}.${String(f.key)}` as FieldPath<ResumeFormValues>}
                      render={({ field }) => (
                        <FormItem className={`space-y-2 ${f.colSpan === 2 ? 'md:col-span-2' : ''}`}>
                          <FormLabel>{f.label}</FormLabel>
                          {f.component === 'input' && (f.key === 'startDate' || f.key === 'endDate' || f.key === 'date') ? (
                            <FormControl>
                              <MonthPicker
                                value={typeof field.value === 'string' ? field.value : undefined}
                                onChange={field.onChange}
                                placeholder={f.placeholder ?? '选择月份'}
                                disabled={readOnly}
                                allowPresent={f.key === 'endDate' ? f.allowPresent === true : false}
                              />
                            </FormControl>
                          ) : f.component === 'input' ? (
                            <FormControl>
                              <Input
                                placeholder={f.placeholder}
                                value={typeof field.value === 'string' ? field.value : ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                disabled={readOnly}
                              />
                            </FormControl>
                          ) : null}
                          {f.component === 'textarea' && (
                            <FormControl>
                              <Textarea
                                rows={4}
                                placeholder={f.placeholder}
                                value={typeof field.value === 'string' ? field.value : ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                disabled={readOnly}
                              />
                            </FormControl>
                          )}
                          {f.component === 'select' && (
                            <SelectDropdown
                              isControlled
                              value={(field.value as string) ?? undefined}
                              onValueChange={field.onChange}
                              placeholder={f.placeholder}
                              className='w-full h-9'
                              disabled={readOnly}
                              items={(f.optionsKey ? options[f.optionsKey] : []).map((opt) => ({ label: opt, value: opt }))}
                            />
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


