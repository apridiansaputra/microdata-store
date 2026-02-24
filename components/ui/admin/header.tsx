interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'Dashboard' }: HeaderProps) {
  return (
    <div className='h-16 flex flex-col bg-white border-b border-border-grey justify-center px-5'>
        <p>{title}</p>
    </div>
  )
}
