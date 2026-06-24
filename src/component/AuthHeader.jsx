import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { UserIcon, ChevronDownIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { getAuthSession, logoutUser } from "../utils/auth";

export default function AuthHeader() {
  const navigate = useNavigate();
  const user = getAuthSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef(null);
  const portalMenuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // removed unused timer (time display removed)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;
      const clickedButton = buttonRef.current && buttonRef.current.contains(target);
      const clickedMenu = portalMenuRef.current && portalMenuRef.current.contains(target);
      if (!clickedButton && !clickedMenu) setMenuOpen(false);
    };

    if (menuOpen) {
      window.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    const updatePos = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 224; // matches w-56 (56 * 4 = 224px)
      let left = rect.right - menuWidth;
      if (left < 8) left = rect.left; // avoid off-screen left
      if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
      const top = rect.bottom + window.scrollY + 8;
      setMenuPos({ top, left });
    };

    if (menuOpen) {
      updatePos();
      window.addEventListener("resize", updatePos);
      window.addEventListener("scroll", updatePos, true);
    }

    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [menuOpen]);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name?.trim() || user?.email?.split("@")[0] || "User";

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <header className="mb-8 overflow-visible rounded-[32px] border border-yellow-400/15 bg-slate-950/95 p-5 text-white shadow-[0_24px_80px_-35px_rgba(250,204,21,0.45)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-6">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.28em] text-yellow-300/80">Authenticated session</p>
            <h2 className="text-2xl font-semibold text-white">Welcome, {displayName}</h2>
            {user?.email ? <p className="text-sm text-slate-300">{user.email}</p> : null}
          </div>

          <div className="relative overflow-visible">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <UserIcon className="h-5 w-5" />
              {displayName}
              <ChevronDownIcon className={`h-4 w-4 transition ${menuOpen ? "rotate-180" : "rotate-0"}`} />
            </button>

            {menuOpen && createPortal(
              <div
                ref={portalMenuRef}
                style={{ position: "absolute", top: `${menuPos.top}px`, left: `${menuPos.left}px`, width: "224px" }}
                className="z-[9999] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-sm shadow-2xl shadow-black/40"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-white transition hover:bg-slate-900"
                >
                  <UserIcon className="h-4 w-4 text-yellow-300" />
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-white transition hover:bg-slate-900"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 text-yellow-300" />
                  Logout
                </button>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
