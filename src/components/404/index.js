import './notFound.css'
import { useHistory } from "react-router"

function NotFound () {
  const history = useHistory()
  return(
    <div className='wrapper'>
      <h1 className='h1'>404</h1>
      <button
        className='btn'
        onClick={() => {
          history.push('/')
          // отправляем пользователя на главную страницу
        }}
      >homePage</button>
    </div>
  )
}

export default NotFound
