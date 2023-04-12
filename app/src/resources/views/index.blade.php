<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Note App</title>
  <link rel="stylesheet" href="./css/styles.css">
</head>
<body>
<header>
  <nav class="my-navbar">
    <a class="my-navbar-brand" href="/">Note App</a>
  </nav>
</header>
<main>
  <div class="container">
    <div class="row">
      <div class="col col-md-offset-3 col-md-6">
        <nav class="panel panel-default">
          <div class="panel-heading">Notes</div>
          <div class="panel-body">
            <a href="{{ route('notes.show') }}" class="btn btn-default btn-block">
              Noteを追加する
            </a>
          </div>
          <div class="list-group">
            @foreach($notes as $note)
              <p class="list-group-item">
                {{ $note->content }}
              </p>
            @endforeach
          </div>
        </nav>
      </div>
    </div>
  </div>
</main>
</body>
</html>