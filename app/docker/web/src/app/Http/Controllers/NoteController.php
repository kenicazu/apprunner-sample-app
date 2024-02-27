<?php

namespace App\Http\Controllers;


use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index()
    {
        $notes = Note::all();

        return view('index', [
            'notes' => $notes,
        ]);
    }

    public function showCreateForm()
    {
        return view('create');
    }

    public function create(Request $request)
    {
        $note = new Note();
        $note->content = $request->content;
        $note->save();

        return redirect()->route('notes.index');
    }
}