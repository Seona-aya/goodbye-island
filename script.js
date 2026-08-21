const SUPABASE_URL = "https://tmweptczrbeusuajrsqs.supabase.co";
const SUPABASE_KEY = "sb_publishable_K-OPOVEm0EAW6PIEV5HXBQ_2WRVRWda";

// ====================
// Supabase
// ====================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ====================
// 找到網頁上的元件
// ====================

const writeButton = document.getElementById("writeButton");
const memoForm = document.getElementById("memoForm");
const releaseButton = document.getElementById("releaseButton");
const memoInput = document.getElementById("memoInput");
const memoWall = document.getElementById("memoWall");


// ====================
// Memo 紙選擇
// ====================

const paperOptions = document.querySelectorAll(".paper-option");

let selectedPaper = "cream";

paperOptions.forEach(function (paper) {

    paper.addEventListener("click", function () {

        paperOptions.forEach(function (item) {
            item.classList.remove("selected");
        });

        paper.classList.add("selected");

        selectedPaper = paper.dataset.paper;

        console.log("選擇的紙：", selectedPaper);

    });

});


// ====================
// 點「寫下你的告別」
// ====================

writeButton.addEventListener("click", function () {

    document.querySelector("h1").style.display = "none";
    document.querySelector(".container > p").style.display = "none";
    writeButton.style.display = "none";

    memoForm.style.display = "block";

});


// ====================
// 建立 Memo
// ====================

function addMemoToWall(memo) {

    const memoElement = document.createElement("div");

    memoElement.className =
        "memo paper-" + memo.paper_style;

    memoElement.textContent = memo.content;


    // ====================
    // 設定 Memo 初始位置
    // ====================

    if (
        memo.position_x !== null &&
        memo.position_y !== null
    ) {

        memoElement.style.left =
            memo.position_x + "%";

        memoElement.style.top =
            memo.position_y + "%";

    } else {

        memoElement.style.left = "50%";
        memoElement.style.top = "50%";

    }


    memoWall.appendChild(memoElement);


    // ====================
    // 拖曳變數
    // 每一張 Memo 都有自己的
    // ====================

    let dragging = false;

    let startX = 0;
    let startY = 0;

    let startLeft = 0;
    let startTop = 0;


    // ====================
    // 按下 Memo
    // ====================

    memoElement.addEventListener(
        "pointerdown",
        function (e) {

            dragging = true;

            memoElement.setPointerCapture(
                e.pointerId
            );

            const wallRect =
                memoWall.getBoundingClientRect();

            const memoRect =
                memoElement.getBoundingClientRect();


            startX = e.clientX;
            startY = e.clientY;


            startLeft =
                memoRect.left -
                wallRect.left;

            startTop =
                memoRect.top -
                wallRect.top;


            memoElement.style.zIndex = "100";

        }
    );


    // ====================
    // 移動 Memo
    // ====================

    memoElement.addEventListener(
        "pointermove",
        function (e) {

            if (!dragging) return;


            const wallRect =
                memoWall.getBoundingClientRect();


            const moveX =
                e.clientX - startX;

            const moveY =
                e.clientY - startY;


            let newLeft =
                startLeft + moveX;

            let newTop =
                startTop + moveY;


            let x =
                (newLeft / wallRect.width) * 100;

            let y =
                (newTop / wallRect.height) * 100;


            // 不讓 Memo 跑出牆外

            x = Math.max(
                2,
                Math.min(85, x)
            );

            y = Math.max(
                2,
                Math.min(85, y)
            );


            memoElement.style.left =
                x + "%";

            memoElement.style.top =
                y + "%";

        }
    );


    // ====================
    // 放開 Memo
    // ====================

    memoElement.addEventListener(
        "pointerup",
        async function (e) {

            if (!dragging) return;

            dragging = false;


            memoElement.releasePointerCapture(
                e.pointerId
            );


            // 直接取得目前 CSS 位置

            const x =
                parseFloat(
                    memoElement.style.left
                );

            const y =
                parseFloat(
                    memoElement.style.top
                );


            console.log(
                "準備儲存：",
                memo.id,
                x,
                y
            );


            // ====================
            // 儲存這一張 Memo 的位置
            // ====================

            const { error } =
                await supabaseClient
                    .from("memos")
                    .update({
                        position_x: x,
                        position_y: y
                    })
                    .eq("id", memo.id);


            if (error) {

                console.error(
                    "Memo 位置儲存失敗：",
                    error
                );

            } else {

                console.log(
                    "Memo 位置儲存成功：",
                    memo.id,
                    x,
                    y
                );

            }

        }
    );

}


// ====================
// 點「把它放下」
// ====================

releaseButton.addEventListener(
    "click",
    async function () {

        const text =
            memoInput.value.trim();


        if (text === "") {

            alert(
                "寫下一點想告別的事情吧。"
            );

            return;

        }


        releaseButton.disabled = true;

        releaseButton.textContent =
            "正在放下……";


        // ====================
        // 新增 Memo 到 Supabase
        // ====================

        const { data, error } =
            await supabaseClient
                .from("memos")
                .insert([
                    {
                        content: text,
                        category: "其他",
                        paper_style: selectedPaper,

                        // 新 Memo 從中央開始
                        position_x: 50,
                        position_y: 50
                    }
                ])
                .select();


        // ====================
        // 新增失敗
        // ====================

        if (error) {

            console.error(
                "新增 Memo 失敗：",
                error
            );

            alert(
                "好像沒有成功放下，再試一次看看。"
            );


            releaseButton.disabled = false;

            releaseButton.textContent =
                "把它放下";

            return;

        }


        // ====================
        // 新增成功
        // ====================

        alert(
            "你的告別已經留在這裡。"
        );


        memoInput.value = "";


        releaseButton.disabled = false;

        releaseButton.textContent =
            "把它放下";


        // ====================
        // ⭐ 只把「這一張」放上去
        // 不重新載入其他 Memo
        // ====================

        if (data && data.length > 0) {

            addMemoToWall(data[0]);

        }

    }
);


// ====================
// 從 Supabase 載入所有 Memo
// ====================

async function loadMemos() {

    const { data, error } =
        await supabaseClient
            .from("memos")
            .select(
                "id, content, created_at, paper_style, position_x, position_y"
            )
            .eq("status", "published")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "讀取 Memo 失敗：",
            error
        );

        return;

    }


    // 清空目前牆面

    memoWall.innerHTML = "";


    // ====================
    // 把資料庫裡的 Memo
    // 一張一張建立
    // ====================

    data.forEach(function (memo) {

        addMemoToWall(memo);

    });

}


// ====================
// 網頁開啟時載入
// ====================

loadMemos();

// ====================
// BGM 音樂控制
// ====================

const bgm = document.getElementById("bgm");
const musicButton = document.getElementById("musicButton");

// 預設音量
bgm.volume = 0.25;


// ====================
// 點音樂按鈕
// ====================

musicButton.addEventListener("click", async function () {

    if (bgm.paused) {

        try {

            await bgm.play();

            musicButton.classList.add("playing");

            musicButton.setAttribute(
                "aria-label",
                "關閉背景音樂"
            );

        } catch (error) {

            console.error(
                "BGM 播放失敗：",
                error
            );

        }

    } else {

        bgm.pause();

        musicButton.classList.remove("playing");

        musicButton.setAttribute(
            "aria-label",
            "開啟背景音樂"
        );

    }

});