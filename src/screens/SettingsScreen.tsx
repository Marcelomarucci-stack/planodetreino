import { useRef, useState } from 'react'
import { clearAll, exportBackup, importBackup, markBackupDone, useData } from '../lib/store'

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function SettingsScreen() {
  const data = useData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const count = Object.keys(data.logs).length
  const completed = Object.values(data.logs).filter((l) => l.completedAt).length

  const onExport = async () => {
    const { filename, json } = exportBackup()
    // No celular, "Compartilhar" permite salvar no Drive, WhatsApp, Arquivos etc.
    const file = new File([json], filename, { type: 'application/json' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Backup do plano de treino' })
        markBackupDone()
        setMsg({ ok: true, text: 'Backup compartilhado.' })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    download(filename, json)
    markBackupDone()
    setMsg({ ok: true, text: `Backup salvo como ${filename}.` })
  }

  const onDownload = () => {
    const { filename, json } = exportBackup()
    download(filename, json)
    markBackupDone()
    setMsg({ ok: true, text: `Backup salvo como ${filename}.` })
  }

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const { imported } = importBackup(await file.text())
      setMsg({ ok: true, text: `Backup importado: ${imported} treino(s) atualizados.` })
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onClear = () => {
    if (!confirm('Apagar TODOS os registros deste aparelho? Faça um backup antes.')) return
    if (!confirm('Tem certeza? Isso não pode ser desfeito.')) return
    clearAll()
    setMsg({ ok: true, text: 'Dados apagados.' })
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Ajustes</h1>

      <section className="card">
        <h2 className="card-title">Backup</h2>
        <p className="small">
          Os dados ficam <strong>só neste aparelho</strong>. Exporte um backup com frequência e guarde no Drive,
          e-mail ou WhatsApp.
        </p>
        <p className="muted small">
          {count} treino(s) com registros · {completed} concluído(s)
          <br />
          Último backup:{' '}
          {data.lastBackupAt ? new Date(data.lastBackupAt).toLocaleString('pt-BR') : 'nunca'}
        </p>
        <button className="big-btn primary" onClick={onExport}>
          💾 Exportar backup
        </button>
        <button className="big-btn secondary" onClick={onDownload}>
          ⬇️ Baixar arquivo .json
        </button>
        <button className="big-btn secondary" onClick={() => fileRef.current?.click()}>
          📂 Importar backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => onImport(e.target.files?.[0])}
        />
        <p className="muted small">
          A importação mescla com os dados atuais: para cada treino, fica a versão editada mais recentemente.
        </p>
        {msg && <div className={`banner ${msg.ok ? 'info' : 'warn'}`}>{msg.text}</div>}
      </section>

      <section className="card">
        <h2 className="card-title">Instalar na tela inicial</h2>
        <p className="small">
          <strong>iPhone (Safari):</strong> botão Compartilhar → “Adicionar à Tela de Início”.
          <br />
          <strong>Android (Chrome):</strong> menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.
        </p>
        <p className="muted small">Depois de aberto uma vez, o app funciona offline.</p>
      </section>

      <section className="card">
        <h2 className="card-title">Zona de perigo</h2>
        <button className="big-btn danger" onClick={onClear}>
          Apagar todos os dados
        </button>
      </section>
    </div>
  )
}
