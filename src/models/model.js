import Lokka from 'lokka'
import Transport from 'lokka-transport-http'

export default class Model {
  constructor () {
    this.client = new Lokka({
      // TODO: use env variable
      transport: new Transport('https://api.graph.cool/simple/v1/UHJvamVjdDpjaW55dHNwNjQwMDJvMDFxcDkwejI5MGhs'),
    })

    // Get the initial data from the transport (it's a promise)
    this.dataPromise = this.client
      // invoke the GraphQL query to get all the todos
      .query(`
        {
          allTodos {
            id
            complete
            text
          }
        }
      `)
      .then(res => res.allTodos)
  }

  addTodo (newTodo, afterAdded) {
    this.client.mutate(`
      {
        todo: createTodo(
            complete: ${newTodo.complete},
            text: "${newTodo.text}",
        ) {
          id
          complete
          text
        }
      }
    `)
    .then(data => data.todo)
    .then(todo => {
      // if success, we replace the promise by adding the newly added todo
      this.dataPromise = this.getAll().then(todos => todos.concat([todo]))
    }, error => {
      // if there is an error, we simply log it
      console.error('Error adding todo:', error)
    })
    // delay 600ms to show changes from optimistic updates
    .then(() => {
      return new Promise(resolve => setTimeout(resolve, 600))
    })
    .then(() => {
      // trigger the afterAdded callback with the updated data promise
      afterAdded(this.getAll())
    })

    // Add the item temporary to the data array to achieve
    // optimistic updates
    return this
      .getAll()
      .then(todos => {
        todos.push(`Adding "${newTodo}" ...`)
        return newTodo
      })
  }

  renameTodo (renamedTodo, afterRenamed) {
    this.client.mutate(`
      {
        todo: updateTodo(
            id: ${renamedTodo.id},
            text: "${renamedTodo.text}",
        ) {
          id
          complete
          text
        }
      }
    `)
    .then(data => {
      data.todo
    })
    .then(todo => {
      // TODO: rename todo in dataPromise
      this.dataPromise = this.getAll().then(todos => {
        todo => {
          if (todo.id === renamedTodo.id) {
            console.log('found it!')
          } else {
            console.log('not found it!')
          }
        }
      })
    }, error => {
      // if there is an error, we simply log it
      console.error('Error renaming todo:', error)
    })
    // delay 600ms to show changes from optimistic updates
    .then(() => {
      return new Promise(resolve => setTimeout(resolve, 600))
    })
    .then(() => {
      // trigger the afterAdded callback with the updated data promise
      afterRenamed(this.getAll())
    })

    // TODO: rename todo in dataPromise
    // Add the item temporary to the data array to achieve
    // optimistic updates
    return this
      .getAll()
      .then(todos => {
        todo => {
          if (todo.id === renamedTodo.id) {
            todo = renamedTodo
          }
        }
      })
  }

  // get all the items but we clone the content inside the promise
  getAll () {
    return this.dataPromise
      .then(allTodos => allTodos.concat([]))
  }
}