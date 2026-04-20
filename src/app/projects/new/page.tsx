export default function NewProjectPage() {
  return (
    <main>
      <h1>Create project</h1>
      <form>
        <label htmlFor="project-name">Project name</label>
        <input id="project-name" name="name" />
        <button type="submit">Create</button>
      </form>
    </main>
  )
}
