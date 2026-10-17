
import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "jindeye-equipment-v1";

const emptyForm = {
  name: "",
  type: "검",
  level: 0,
  attack: 10,
  defense: 0,
  health: 0,
  attackPerLevel: 2,
  defensePerLevel: 1,
  healthPerLevel: 5,
};

const equipmentTypes = ["검", "도끼", "활", "방어구", "투구", "기타"];

function calculateStats(item) {
  return {
    attack:
      Number(item.attack) +
      Number(item.level) * Number(item.attackPerLevel),
    defense:
      Number(item.defense) +
      Number(item.level) * Number(item.defensePerLevel),
    health:
      Number(item.health) +
      Number(item.level) * Number(item.healthPerLevel),
  };
}

function loadEquipment() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function App() {
  const [equipment, setEquipment] = useState(loadEquipment);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
  }, [equipment]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addEquipment = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("장비 이름을 입력해 주세요.");
      return;
    }

    const item = {
      ...form,
      id: crypto.randomUUID(),
      name: form.name.trim(),
      level: Number(form.level),
      attack: Number(form.attack),
      defense: Number(form.defense),
      health: Number(form.health),
      attackPerLevel: Number(form.attackPerLevel),
      defensePerLevel: Number(form.defensePerLevel),
      healthPerLevel: Number(form.healthPerLevel),
    };

    setEquipment((current) => [item, ...current]);
    setForm({ ...emptyForm });
  };

  const deleteEquipment = (id) => {
    if (!window.confirm("이 장비를 진열대에서 삭제할까요?")) {
      return;
    }

    setEquipment((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const total = equipment.reduce(
    (sum, item) => {
      const stats = calculateStats(item);
      sum.attack += stats.attack;
      sum.defense += stats.defense;
      sum.health += stats.health;
      return sum;
    },
    { attack: 0, defense: 0, health: 0 }
  );

  const preview = calculateStats({
    ...form,
    level: Number(form.level) || 0,
  });

  const numberField = (label, field, help) => (
    <label className="field" key={field}>
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step="1"
        value={form[field]}
        onChange={(event) =>
          updateForm(field, event.target.value)
        }
        required
      />
      {help && <small>{help}</small>}
    </label>
  );

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">◆</span>
          진열대
        </a>
        <span className="local-badge">개인 진열대 미리보기</span>
      </header>

      <section className="hero" id="home">
        <p className="eyebrow">MINECRAFT EQUIPMENT SHOWCASE</p>
        <h1>
          나만의 장비를
          <br />
          <span>진열하고 강화하세요.</span>
        </h1>
        <p className="hero-description">
          장비를 등록하고 강화 수치에 따른 전투 능력치를 확인하세요.
        </p>
      </section>

      <section className="summary-grid">
        <div className="summary-card">
          <span>등록 장비</span>
          <strong>{equipment.length}<small> 개</small></strong>
        </div>
        <div className="summary-card">
          <span>총 공격력</span>
          <strong>{total.attack.toLocaleString()}</strong>
        </div>
        <div className="summary-card">
          <span>총 방어력</span>
          <strong>{total.defense.toLocaleString()}</strong>
        </div>
        <div className="summary-card">
          <span>총 추가 체력</span>
          <strong>{total.health.toLocaleString()}</strong>
        </div>
      </section>

      <section className="workspace">
        <div className="panel form-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEW EQUIPMENT</p>
              <h2>장비 등록하기</h2>
            </div>
            <span className="heading-icon">＋</span>
          </div>

          <form onSubmit={addEquipment}>
            <label className="field">
              <span>장비 이름</span>
              <input
                type="text"
                placeholder="예: 전설의 다이아몬드 검"
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                maxLength={50}
                required
              />
            </label>

            <label className="field">
              <span>장비 종류</span>
              <select
                value={form.type}
                onChange={(event) =>
                  updateForm("type", event.target.value)
                }
              >
                {equipmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-divider" />

            <h3 className="subheading">강화 설정</h3>

            {numberField("강화 단계 (+)", "level")}
            <p className="field-note">
              예: 5를 입력하면 5강 장비로 등록됩니다.
            </p>

            <div className="form-divider" />

            <h3 className="subheading">기본 능력치</h3>
            <div className="input-grid">
              {numberField("공격력", "attack")}
              {numberField("방어력", "defense")}
              {numberField("추가 체력", "health")}
            </div>

            <div className="form-divider" />

            <h3 className="subheading">강화 단계별 증가량</h3>
            <p className="field-note">
              강화 1단계마다 증가하는 능력치를 직접 설정하세요.
            </p>
            <div className="input-grid">
              {numberField("공격력 증가", "attackPerLevel")}
              {numberField("방어력 증가", "defensePerLevel")}
              {numberField("체력 증가", "healthPerLevel")}
            </div>

            <div className="preview-box">
              <span>최종 능력치 미리보기</span>
              <div className="preview-stats">
                <span>⚔ 공격력 <b>{preview.attack}</b></span>
                <span>🛡 방어력 <b>{preview.defense}</b></span>
                <span>♥ 추가 체력 <b>{preview.health}</b></span>
              </div>
            </div>

            <button className="primary-button" type="submit">
              ＋ 장비 진열하기
            </button>
          </form>
        </div>

        <div className="display-panel">
          <div className="section-heading display-heading">
            <div>
              <p className="eyebrow">MY COLLECTION</p>
              <h2>나의 진열대</h2>
            </div>
            <span className="count-badge">{equipment.length}개</span>
          </div>

          {equipment.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◇</div>
              <h3>아직 등록된 장비가 없습니다.</h3>
              <p>
                왼쪽에서 첫 번째 장비를 등록하고
                <br />
                나만의 진열대를 만들어 보세요.
              </p>
            </div>
          ) : (
            <div className="equipment-grid">
              {equipment.map((item) => {
                const stats = calculateStats(item);

                return (
                  <article className="equipment-card" key={item.id}>
                    <div className="equipment-card-top">
                      <span className="type-badge">{item.type}</span>
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => deleteEquipment(item.id)}
                        aria-label={`${item.name} 삭제`}
                        title="장비 삭제"
                      >
                        ×
                      </button>
                    </div>

                    <div className="equipment-art">
                      <span>
                        {item.type === "검" ? "⚔" :
                         item.type === "도끼" ? "🪓" :
                         item.type === "활" ? "➶" :
                         item.type === "방어구" ? "🛡" :
                         item.type === "투구" ? "⛑" : "◆"}
                      </span>
                    </div>

                    <div className="equipment-info">
                      <h3>{item.name}</h3>
                      <span className="enhance-level">
                        +{item.level} 강화
                      </span>
                    </div>

                    <div className="equipment-stats">
                      <div>
                        <span>⚔ 공격력</span>
                        <strong>{stats.attack}</strong>
                      </div>
                      <div>
                        <span>🛡 방어력</span>
                        <strong>{stats.defense}</strong>
                      </div>
                      <div>
                        <span>♥ 추가 체력</span>
                        <strong>{stats.health}</strong>
                      </div>
                    </div>

                    <div className="equipment-footer">
                      <span>강화 적용 완료</span>
                      <span className="status-dot" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <span>진열대</span>
        <p>나만의 장비를 기록하고 공유하는 공간</p>
        <small>
          현재 버전은 브라우저 로컬 저장 방식이며,
          다른 사용자와 데이터가 공유되지는 않습니다.
        </small>
      </footer>
    </main>
  );
}

export default App;
