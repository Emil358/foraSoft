import { useCallback, useEffect, useRef, useState } from "react"

function useStateWithCallback (initialState) {
  const [state, setState] = useState(initialState)
  const cbRef = useRef(null);

  const updateState = useCallback((newState, cb) => {
    cbRef.current = cb;
    setState(prev => typeof newState === 'function' ? newState(prev) : newState)
  }, [])

  // создаем функцию, используя хук useCallback,
  // которая привязывает переданый параметр cb с cbRef и вызвает функцию setState в зависимости от типа переданного параметра

  useEffect(() => {
    if(cbRef.current) {
      cbRef.current(state);
      cbRef.current = null;
    }
  }, [state])

  // вызывает cbRef и перезатирает ее, когда меняется state

  return [state, updateState];
}

export default useStateWithCallback
