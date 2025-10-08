import React, { ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { NavCollapsible, NavItem, NavLink, type NavGroup } from './types'

export function NavGroup({ title, items }: NavGroup) {
  const { state, isMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  
  // PC端：始终使用窄版垂直布局（图标在上，文字在下）
  const isNarrowPcLayout = !isMobile
  
  return (
    <SidebarGroup>
      {title?.trim() ? <SidebarGroupLabel>{title}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((item) => {
          const key = `${item.title}-${item.url}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={href} isNarrow={isNarrowPcLayout} />

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )

          return <SidebarMenuCollapsible key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
)

const CustomNavBadge = ({ 
  text, 
  icon, 
  className = '' 
}: { 
  text: string
  icon?: string | React.ElementType
  className?: string
}) => (
  <div className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium ${className}`}>
    {icon && (
      typeof icon === 'string' ? (
        <img src={icon} alt="" className="h-3 w-3" />
      ) : (
        React.createElement(icon, { className: "h-3 w-3" })
      )
    )}
    <span>{text}</span>
  </div>
)

const SidebarMenuLink = ({ item, href, isNarrow = false }: { item: NavLink; href: string; isNarrow?: boolean }) => {
  const { setOpenMobile } = useSidebar()
  
  // PC端窄版布局：图标在上，文字在下
  if (isNarrow) {
    return (
      <SidebarMenuItem>
        <Link 
          to={item.url} 
          onClick={() => setOpenMobile(false)}
          className={`
            relative flex flex-col items-center justify-center gap-1 py-3 px-1
            rounded-md transition-colors
            hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
            ${checkIsActive(href, item) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
          `}
        >
          {item.icon && <item.icon className='h-6 w-6 flex-shrink-0' />}
          <span className='text-[10px] font-medium text-center leading-tight max-w-full break-keep whitespace-nowrap'>{item.title}</span>
          {item.customBadge && (
            <div className='absolute top-1 right-1'>
              <div className={`rounded px-1 py-0.5 text-[8px] font-medium leading-none ${item.customBadge.className}`}>
                {item.customBadge.text}
              </div>
            </div>
          )}
          {item.badge && (
            <Badge className='absolute top-1 right-1 h-4 px-1 text-[9px]'>{item.badge}</Badge>
          )}
        </Link>
      </SidebarMenuItem>
    )
  }
  
  // 移动端或其他情况：保持原有布局
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
          {item.customBadge && (
            <CustomNavBadge 
              text={item.customBadge.text}
              icon={item.customBadge.icon}
              className={item.customBadge.className}
            />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

const SidebarMenuCollapsible = ({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) => {
  const { setOpenMobile } = useSidebar()
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            {item.customBadge && (
              <CustomNavBadge 
                text={item.customBadge.text}
                icon={item.customBadge.icon}
                className={item.customBadge.className}
              />
            )}
            <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={checkIsActive(href, subItem)}
                >
                  <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                    {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                    {subItem.customBadge && (
                      <CustomNavBadge 
                        text={subItem.customBadge.text}
                        icon={subItem.customBadge.icon}
                        className={subItem.customBadge.className}
                      />
                    )}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const SidebarMenuCollapsedDropdown = ({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) => {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            {item.customBadge && (
              <CustomNavBadge 
                text={item.customBadge.text}
                icon={item.customBadge.icon}
                className={item.customBadge.className}
              />
            )}
            <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                to={sub.url}
                className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}
              >
                {sub.icon && <sub.icon />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && (
                  <span className='ml-auto text-xs'>{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
