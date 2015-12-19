# CTFileAPI
File-based CTF-Question Serving API.

## How to use
- Clone project.
- ``npm install``
- Create ``questions`` folder in project root.
- Put questions folloing below.
  - ``questionList.json`` is JSON Array of folders.
    - If not exist, create dynamically
  - Folder is ``{Category}-{Points}-{QuestionName}``
  - ``README.md`` is description of question.
  - ``flag.sha3-512`` is SHA3-512 Hash.
  - Path in .md should be relateive path.
  - ``README.md`` and ``flag.sha3-512`` are required.

```
questions/
  |--- questionList.json
  |--- Binary-100-Overflow
  |   |- README.md
  |   |- flag.sha3-512
  |   |- q.exe
  |
  |--- Misc-050-HelloWorld
  |   |- README.md
  |   |- flag.sha3-512
  |   |- file.dat
  |
  |--- Web-500-JavaScript
      |- README.md
      |- flag.sha3-512
```

- Then, ``npm start``.

## API (json)
- GET ``/api/status``
  - Server status.
- GET/POST ``/api/scores``
  - All Users and Scores
  - ``Content-Type: application/json`` is required if you post
- POST ``/api/auth``
  - Login
  - ``Content-Type: application/json`` is required
- POST ``/api/signup``
  - Signup
  - ``Content-Type: application/json`` is required
- GET ``/api/logout``
  - Logout
- GET ``/api/user``
  - User Info if you passed auth
- GET ``/api/users``
  - All users Info
- POST ``/api/submit``
  - You submit flag
  - ``Content-Type: application/json`` is required
  - Example
    ```json
    {
      "question": "Misc-100-Hello",
      "flag":"FLAG{Hello,World}"
    }
    ```
- GET ``/{staticFilePath}``
  - Example: ``/Misc-100-Hello/README.md``
