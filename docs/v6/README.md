# Audio de Memoria Reciclable

Los archivos `.wav` de esta carpeta son sonidos **placeholder generados
por código** (síntesis simple con Python, sin librerías externas —
ver `generate_sounds.py` en la raíz del proyecto). Son cortos, no se
superponen entre sí y ya están completamente conectados en `script.js`
a través del `AudioManager`, así que el juego suena "de fábrica" sin
que tengas que hacer nada.

Si más adelante quieres usar tu propia música y efectos (por ejemplo
archivos `.mp3` con mejor producción), simplemente reemplaza estos
archivos **conservando exactamente los mismos nombres**:

| Archivo                    | Evento en el juego                              |
|-----------------------------|--------------------------------------------------|
| `background-music.wav`      | Música de fondo (loop, desde que se presiona JUGAR) |
| `click.wav`                  | Presionar JUGAR / Jugar de nuevo                 |
| `memory-start.wav`           | Comienza la fase de memoria                      |
| `memory-end.wav`             | Termina la cuenta regresiva de memoria           |
| `pickup.wav`                 | Agarrar el paquete activo                        |
| `drop.wav`                   | Soltar el paquete sobre una caneca               |
| `correct.wav`                | Clasificación correcta                           |
| `wrong.wav`                  | Clasificación incorrecta                         |
| `level-up.wav`               | Nivel completado                                 |
| `game-over.wav`              | Game Over                                        |
| `high-score.wav`             | Nuevo puntaje más alto                           |
| `menu-back.wav`              | Volver al menú                                   |

Si prefieres usar `.mp3` en lugar de `.wav`, solo hay que actualizar
las rutas en `SOUND_FILES` y `MUSIC_FILE` dentro de la clase
`AudioManager` en `script.js` (sección 0 del archivo) — el resto del
sistema de audio no necesita ningún otro cambio.
