const canvas_x = 1500
const canvas_y = 1500

async function file_check(file_name) {
  try {
    const res = await fetch(file_name);
    return res.status === 200; // 存在すれば true
  } catch (error) {
    return false; // エラー時も false
  }
}

async function loadJson() {
  try {
    const response = await fetch('./data.json');
    return await response.json();
  } catch (error) {
    console.error('JSONの取得中にエラーが発生しました:', error);
    notification.error("データの取得中にエラーが発生しました")
    return {"categories":[{"name":"データの読み込みに失敗しました","values":[]}]}
  }
}

const json_data = await loadJson(); // ← 必ず呼び出す
console.log(json_data["categories"]);
json_data["categories"].forEach(name => {
    const button = document.createElement("button");
    button.setAttribute("data-tab",json_data["categories"].indexOf(name));
    if (json_data["categories"].indexOf(name) == 0){
        button.classList = "active";
    };
    button.appendChild(document.createTextNode(name["name"]));
    document.querySelector("div.tab-buttons").appendChild(button);
    const div = document.createElement("div");
    if (json_data["categories"].indexOf(name) == 0){
        div.setAttribute("class","tab-content active");
    } else {
        div.setAttribute("class","tab-content");
    };
    div.setAttribute("id","tab"+String(json_data["categories"].indexOf(name)));
    document.querySelector("div.tab-bar").appendChild(div);
});

function load_categories(value=null,text=null) {
    let kari = {};
    let count = 0;
    json_data["categories"].forEach(name => {
        kari[count] = [];
        name["values"].forEach(item => {
            if (value != null){
                kari[count].push(item[value]);
            } else {
                kari[count].push(text);
            }
        });
        count++;
    });
    console.log(kari);
    return kari
}

function load_categories3(value=null,text=null) {
    let kari = [];
    let count = 0;
    json_data["categories"].forEach(name => {
        kari[count] = [];
        name["values"].forEach(item => {
            if (value != null){
                kari[count].push(item[value]);
            } else {
                kari[count].push(text);
            }
        });
        count++;
    });
    console.log(kari);
    return kari
}

let selectedItem = null;
let selectedColorIndex = 0;
let colorPalette = null;
let paletteContent = null;

function openPalette(textures, itemIndex,tab,categoryName) {
    if (!colorPalette) {
        colorPalette = document.getElementById("colorPalette");
        paletteContent = document.getElementById("paletteContent");
        document.getElementById("paletteClose").addEventListener("click", () => {
            colorPalette.classList.remove("open");
        });
    }

    colorPalette.classList.add("open");
    paletteContent.innerHTML = "";

    if (!textures) {
        paletteContent.innerHTML = "<p>このアイテムは色変え非対応です。</p>";
        return;
    }

    textures.forEach((colorData, i) => {
        const btn = document.createElement("div");
        btn.className = "color-option";
        btn.style.backgroundImage = `url(${colorData.icon})`;

        btn.addEventListener("click", () => {
            selectedColorIndex = i;
            const img2 = new Image();
            img2.src = colorData.texture;
            img2.onload = () => {
                save(tab,categoryName,[itemIndex,i,colorData.texture,img2])
                draw()
            }
        });

        paletteContent.appendChild(btn);
    });
}

function load_categories2() {
    let kari = [];
    let count = 0;
    json_data["categories"].forEach(name => {
        kari.push([]);
        name["values"].forEach(item => {
            const img = new Image();
            kari[count].push([0,null,"",img]);
        });
        count++;
    });
    console.log(kari);
    return kari
}

function load_small_categories() {
    let kari = [];
    let count = 0;
    json_data["categories"].forEach(name => {
        kari.push({});
        name["values"].forEach(small => {
            kari[count][small["name"]] = [{"name":"はずす","icon":"./textures/categories_icon/null.png","texture":"./textures/categories_icon/null.png"}];
            small["values"].forEach(item => {
                kari[count][small["name"]].push({"name":item["name"],"icon":item["icon"],"texture":item["texture"]})
            })
        });
        count++;
    });
    console.log(kari);
    return kari
}
// -----------------------------------------------
// 小カテゴリ（左メニュー）のリストを定義
// -----------------------------------------------
const categories = load_categories("name");
const categories_img = load_categories("icon");
const img_z_index = load_categories3("z-index");
var data = load_categories2();

// 表示用のサンプル画像（21個 = 7×3グリッド）
const images = Array(21).fill("sample.png");
const small_categories = load_small_categories();
console.log(small_categories)

// -----------------------------------------------
// タブの中身を生成する関数
// 各大カテゴリに対して、「左の小カテゴリ + 右の画像エリア」を作る
// -----------------------------------------------
function createCategory(tabIndex) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.classList = `menu-${tabIndex}`

    // 左側の小カテゴリメニュー
    const side = document.createElement("div");
    side.className = "side-menu";

    // 小カテゴリを1つずつ追加
    categories[tabIndex].forEach(name => {
        const box = document.createElement("div");
        box.style.position = "relative"; // ツールチップの位置基準
        box.classList = "box-content"
        if (categories[tabIndex].indexOf(name) == 0){
            box.classList.add("active")
        }

        const img = document.createElement("img");
        img.src = categories_img[tabIndex][categories[tabIndex].indexOf(name)]; // カテゴリのアイコン（仮素材）
        img.setAttribute("onerror","this.src = './textures/categories_icon/NOIMAGE.png'")
        //box.onclick = () => loadGrid(tabIndex, name); // クリックで右エリア更新
        box.onclick = () => {
            loadGrid(tabIndex, name);
            remove_class();
            box.classList.add('active');
        };
        //box.setAttribute("onclick","loadGrid("+tabIndex+", '"+name+"');remove_class();this.classList.add('active');");

        // hover用のカテゴリ名表示（ツールチップ）
        const tooltip = document.createElement("div");
        tooltip.className = "icon-tooltip";
        tooltip.textContent = name;

        box.appendChild(img);
        box.appendChild(tooltip);
        side.appendChild(box);
    });

    // 右側の画像一覧エリア
    const grid = document.createElement("div");
    grid.className = "grid-area";
    grid.textContent = "左のカテゴリを選んでね♡";

    wrapper.appendChild(side);
    wrapper.appendChild(grid);
    return wrapper;
}


// -----------------------------------------------
// 小カテゴリを選択した時に右側のグリッドを更新する関数
// -----------------------------------------------
function remove_class(){
    const class_element = document.querySelectorAll(`div.box-content.active`);
    class_element.forEach((value) => {
        value.classList.remove("active");
        const colorPalette = document.getElementById("colorPalette");
        colorPalette.classList = "palette";
    });
}

function remove_select(){
    const class_element = document.querySelectorAll(`img.item.active`);
    class_element.forEach((value) => {
        value.classList.remove("active");
        const colorPalette = document.getElementById("colorPalette");
        colorPalette.classList = "palette";
    });
}

function save(tab,categoryName,index){
    data[tab][categories[tab].indexOf(categoryName)] = index;
    console.log(data);
}

function get(tab,categoryName,index){
    return data[tab][categories[tab].indexOf(categoryName)][0] == index;
}

function get_color(tab,categoryName){
  if (data[tab][categories[tab].indexOf(categoryName)][1] == null) {
    return 0;
  } else {
    return data[tab][categories[tab].indexOf(categoryName)][1];
  }
}

function flattenAndSort(arr, arr2) {
  // arr は完全 flatten
  const flatA = arr.flat(Infinity);

  // arr2 は「1段のみ flatten → 最終階層セットを崩さない」
  const flatB = arr2.flat(1);

  // ペア化（arr のインデックスに arr2 を対応）
  const pairs = flatA.map((v, i) => ({ a: v, b: flatB[i] }));

  // arr を基準に昇順ソート
  pairs.sort((p1, p2) => p1.a - p2.a);

  // ソート済みを取り出す
  const sortedArr = pairs.map(p => p.a);
  const sortedArr2 = pairs.map(p => p.b);

  return {
    arr: sortedArr,
    arr2: sortedArr2
  };
}

function deepClone(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  // Array
  if (Array.isArray(value)) {
    return value.map(v => deepClone(v));
  }

  // DOMノード
  if (value instanceof Node) {
    return value.cloneNode(true);  // 子要素もコピー
  }

  // Object
  const obj = {};
  for (const key in value) {
    obj[key] = deepClone(value[key]);
  }
  return obj;
}

function waitImage(img) {
    return new Promise(resolve => {
        if (img.complete) resolve();
        else img.onload = () => resolve();
    });
}

async function draw() {
    let img_z_index_2 = deepClone(img_z_index);
    img_z_index_2.push([0]);

    const body_img = new Image();
    body_img.src = "./textures/texture/body/body.png";

    // body_img のロード待ち
    await waitImage(body_img);

    let data_2 = deepClone(data);
    data_2.push([[0, null, "./textures/texture/body/body.png", body_img]]);

    // 並び替え
    data_2 = flattenAndSort(img_z_index_2, data_2).arr2;

    // data_2 内すべての img 読み込みを待つ
    await Promise.all(
        data_2.map(item => waitImage(item[3]))
    );

    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    data_2.forEach(i => {
        ctx.drawImage(i[3], 0, 0, canvas_x, canvas_y);
    });

    console.log("描画完了");
}


function loadGrid(tab, categoryName) {
    // element.classList.add("active");
    const grid = document.querySelector(`#tab${tab} .grid-area`);
    grid.innerHTML = ""; // リセットしてから追加
    let count = 0;
    small_categories[tab][categoryName].forEach((src, idx) => {
        count = idx;
        const div = document.createElement("div");
        div.classList = "item-content";
        const img = document.createElement("img");
        img.classList = "item";
        img.src = src["icon"];
        img.setAttribute("onerror","this.src = './textures/categories_icon/NOIMAGE.png'")

        // クリック時に座標 + カテゴリ情報を出力（デバッグ用）
        if(typeof small_categories[tab][categoryName][idx]["texture"] == "string"){
            img.onclick = () => {
                remove_select();
                img.classList.add('active');
                if (idx != 0) { 
                    const img2 = new Image();
                    img2.src = small_categories[tab][categoryName][idx]["texture"];
                    img2.onload = () => {
                        save(tab,categoryName,[idx,null,small_categories[tab][categoryName][idx]["texture"],img2])
                        draw();
                    }
                } else {
                    const img2 = new Image();
                    img2.src = "";
                    save(tab,categoryName,[idx,null,"",img2])
                    draw();
                }
                file_check(small_categories[tab][categoryName][idx]["texture"]).then(value => {if(!value) {notification.warning("テクスチャの読み込みに失敗しました")}});
                console.log(`${typeof small_categories[tab][categoryName][idx]["texture"]}`);
            };
        } else {
            img.onclick = () => {
                console.log(`${small_categories[tab][categoryName][idx]["texture"][get_color(tab,categoryName)]["texture"]}`);
                remove_select();
                img.classList.add('active');
                openPalette(small_categories[tab][categoryName][idx]["texture"],idx,tab,categoryName)
                if (idx != 0) { 
                    const img2 = new Image();
                    img2.src = small_categories[tab][categoryName][idx]["texture"][get_color(tab,categoryName)]["texture"];
                    img2.onload = () => {
                        save(tab,categoryName,[idx,null,small_categories[tab][categoryName][idx]["texture"][get_color(tab,categoryName)]["texture"],img2])
                        draw()
                    }
                } else {
                    const img2 = new Image();
                    img2.src = "";
                    save(tab,categoryName,[idx,null,"",img2])
                    draw();
                }
            };
        }
        if (get(tab,categoryName,idx)) {
            img.classList.add('active');
        }
        const icon_tooltip = document.createElement("div");
        icon_tooltip.classList ="icon-tooltip2";
        icon_tooltip.appendChild(document.createTextNode(src["name"]));
        div.appendChild(img);
        div.appendChild(icon_tooltip);
        grid.appendChild(div);
    });
    if (count < 8) {
        for (let i = count; i < 8; i++) {
            const div = document.createElement("div");
            div.classList = "item-content";
            grid.appendChild(div);
        }
    }
    const width = (document.querySelector(`.tab-bar`).clientWidth - document.querySelector(`#tab${tab} .side-menu`).clientWidth - grid.clientWidth)/2 -grid.style.margin;
    console.log(document.querySelector(`#tab${tab} div.menu-${tab}`).clientWidth);
    console.log(document.querySelector(`#tab${tab} .side-menu`).clientWidth);
    console.log(grid.clientWidth);
    grid.style = `margin-left:${width}px;margin-right:${width}px;`
}


// -----------------------------------------------
// 初期化：各タブに中身を構築
// -----------------------------------------------
for (let i = 0; i < json_data["categories"].length; i++) {
    document.getElementById(`tab${i}`).appendChild(createCategory(i));
    loadGrid(i, categories[i][0]);
}
draw();

// -----------------------------------------------
// タブ切り替え処理
// -----------------------------------------------
document.querySelectorAll(".tab-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
        // 選択中タブの見た目切り替え
        document.querySelector(".tab-buttons button.active").classList.remove("active");
        btn.classList.add("active");

        // 中身を切り替え
        document.querySelector(".tab-content.active").classList.remove("active");
        document.getElementById(`tab${btn.dataset.tab}`).classList.add("active");
        remove_class();
        //document.querySelector(`.tab-content.active .side-menu div`).classList.add("active");
        document.querySelector(`.tab-content.active .side-menu div`).click();
    });
});

document.getElementById('saveButton').addEventListener('click', () => {
  const canvas = document.getElementById("mainCanvas");
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'canvas_image.png';
    link.click();
});