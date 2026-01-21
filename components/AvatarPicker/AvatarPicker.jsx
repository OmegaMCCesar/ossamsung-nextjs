// components/AvatarPicker/AvatarPicker.jsx
import { useState } from "react";

const AVATARS = [
  "/avatars/pro1.svg","/avatars/pro2.svg","/avatars/cart1.svg","/avatars/tech1.svg"
];

export default function AvatarPicker({ uid, onSaved }) {
  const [selected, setSelected] = useState(null);
  async function save() {
    await fetch("/api/profile/set-avatar", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ uid, avatar: selected })
    });
    if(onSaved) onSaved(selected);
  }
  return (
    <div>
      <div style={{display:"flex",gap:10}}>
        {AVATARS.map(a => (
          <img key={a} src={a} style={{width:80, border: selected===a ? "3px solid blue":"1px solid #ddd", cursor:"pointer"}} onClick={()=>setSelected(a)} />
        ))}
      </div>
      <button onClick={save} disabled={!selected}>Guardar avatar</button>
    </div>
  );
}
