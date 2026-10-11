import QtQuick 2.15
import QtQuick.Controls 2.15
import "js/Game.js" as Game
import "."

Item {
    id: root
    focus: true

    property string callsign: ""
    property var run: null
    property bool waiting: true

    signal finished(int score)
    signal quitToMenu()

    function start() {
        run = Game.createRun(Date.now() % 1000003)
        waiting = false
        forceActiveFocus()
        tick.restart()
    }

    function endRun() {
        tick.stop()
        waiting = true
        finished(Game.finalScore(run))
    }

    Timer {
        id: tick
        interval: 16
        repeat: true
        onTriggered: {
            if (!run || !run.alive)
                return
            Game.step(run, interval / 1000)
            canvas.requestPaint()
            if (!run.alive)
                endRun()
        }
    }

    Canvas {
        id: canvas
        anchors.fill: parent
        renderStrategy: Canvas.Cooperative

        onPaint: {
            var ctx = getContext("2d")
            var w = width
            var h = height
            ctx.fillStyle = Theme.bg0
            ctx.fillRect(0, 0, w, h)

            // sky wash
            var g = ctx.createLinearGradient(0, 0, 0, h)
            g.addColorStop(0, "#0c1422")
            g.addColorStop(0.7, "#070b12")
            g.addColorStop(1, "#05070c")
            ctx.fillStyle = g
            ctx.fillRect(0, 0, w, h)

            var scroll = run ? (run.distance * 0.15) % w : 0
            ctx.strokeStyle = "#1a2740"
            ctx.lineWidth = 1
            for (var i = 0; i < 8; i++) {
                var x = ((i * w / 7) - scroll + w) % w
                ctx.beginPath()
                ctx.moveTo(x, h * 0.2)
                ctx.lineTo(x - 40, h)
                ctx.stroke()
            }

            var laneY = h * Game.LANE_Y
            ctx.strokeStyle = Theme.pink
            ctx.globalAlpha = 0.85
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(0, laneY + h * 0.06)
            ctx.lineTo(w, laneY + h * 0.06)
            ctx.stroke()
            ctx.globalAlpha = 1

            if (!run)
                return

            var obs = run.obstacles
            for (var j = 0; j < obs.length; j++) {
                var o = obs[j]
                var ox = o.x * w
                var oy = o.y * h
                var ow = o.w * w
                var oh = o.h * h
                if (o.kind === "drone") {
                    ctx.fillStyle = "#ff4d8d"
                    ctx.beginPath()
                    ctx.arc(ox + ow * 0.5, oy - oh * 0.35, Math.max(ow, oh) * 0.45, 0, Math.PI * 2)
                    ctx.fill()
                } else if (o.kind === "gate") {
                    ctx.fillStyle = "#f0b429"
                    ctx.fillRect(ox, oy - oh * 0.35, ow, oh * 0.35)
                } else {
                    ctx.fillStyle = "#5b6b7c"
                    ctx.fillRect(ox, oy - oh, ow, oh)
                }
            }

            var px = run.playerX * w
            var py = run.playerY * h
            var ph = (run.sliding > 0 ? 0.06 : 0.12) * h
            var pw = 0.05 * w
            var pTop = run.sliding > 0 ? py + 0.04 * h - ph : py - ph
            ctx.fillStyle = "#2ee6c8"
            ctx.fillRect(px, pTop, pw, ph)
            ctx.fillStyle = "#e8f1f4"
            ctx.beginPath()
            ctx.arc(px + pw * 0.5, pTop - 4, 4, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    // HUD — one thin bar, no cards
    Row {
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.margins: 14
        spacing: 18
        Text {
            text: root.callsign
            color: Theme.teal
            font.pixelSize: 14
            font.bold: true
        }
        Text {
            text: run ? ("SCORE " + run.score) : "SCORE 0"
            color: Theme.ink
            font.pixelSize: 14
            font.bold: true
        }
        Text {
            text: run ? ("COMBO " + run.combo) : ""
            color: Theme.mute
            font.pixelSize: 13
        }
    }

    Text {
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 16
        visible: !!run && run.alive
        text: "Space / ↑ jump   ·   ↓ slide   ·   Esc menu"
        color: Theme.mute
        font.pixelSize: 12
    }

    Keys.onPressed: function (event) {
        if (!run)
            return
        if (event.key === Qt.Key_Escape) {
            tick.stop()
            quitToMenu()
            event.accepted = true
            return
        }
        if (!run.alive)
            return
        if (event.key === Qt.Key_Space || event.key === Qt.Key_Up) {
            Game.jump(run)
            event.accepted = true
        } else if (event.key === Qt.Key_Down) {
            Game.slide(run)
            event.accepted = true
        }
    }

    Component.onCompleted: start()
}
