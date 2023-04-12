<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NoteController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', [NoteController::class, 'index'])->name('notes.index');
Route::get('/notes/create', [NoteController::class, 'showCreateForm'])->name('notes.show');
Route::post('/notes/create', [NoteController::class, 'create'])->name('notes.create');