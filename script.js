// =// ================= SUPABASE CONNECTION =================

const SUPABASE_URL = "https://lyxioiftpegpjyyamtdl.supabase.co";

const SUPABASE_KEY = "sb_publishable_8C07BfaP51T00DLdQttrvg_3689ztrX";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ====================================================
// DILSIGHT - USER ACCOUNT SYSTEM
// =====================================================


// ================= SIGN UP =================

const signupForm =
    document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document.getElementById(
                    "signupName"
                ).value.trim();

            const email =
                document.getElementById(
                    "signupEmail"
                ).value.trim();

            const username =
                document.getElementById(
                    "signupUsername"
                ).value.trim();

            const password =
                document.getElementById(
                    "signupPassword"
                ).value;


            const { data, error } =
                await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {

                            full_name: name,

                            username: username

                        }

                    }

                });


            if (error) {

                alert(error.message);

                return;

            }


            if (data.user) {

                const { error: profileError } =
                    await supabaseClient
                        .from("profiles")
                        .upsert({

                            id: data.user.id,

                            full_name: name,

                            username: username

                        });


                if (profileError) {

                    console.error(
                        "Profile error:",
                        profileError
                    );

                }

            }


            alert(
                "Account created successfully! Please check your email if verification is required."
            );


            window.location.href =
                "login.html";

        });

}


// ================= LOGIN =================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const loginUser =
                document.getElementById("loginUser")
                    .value.trim();

            const loginPassword =
                document.getElementById("loginPassword")
                    .value;


            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: loginUser,

                    password: loginPassword

                });


            if (error) {

                alert(
                    "Login failed: " + error.message
                );

                return;

            }


            if (data.user) {

                localStorage.setItem(
                    "dilsightLoggedIn",
                    "true"
                );


                localStorage.setItem(
                    "dilsightUser",
                    JSON.stringify({
                        id: data.user.id,

                        name:
                            data.user.user_metadata?.full_name
                            || "User",

                        email:
                            data.user.email,

                        username:
                            data.user.user_metadata?.username
                            || ""

                    })
                );


                alert(
                    "Login successful!"
                );


                window.location.href =
                    "write.html";

            }

        });

}


// ================= WRITE PAGE LOGIN CHECK =================

if (
    window.location.pathname.includes("write.html")
) {

    const loggedIn =
        localStorage.getItem("dilsightLoggedIn");

    const storedUser =
        JSON.parse(
            localStorage.getItem("dilsightUser")
        );


    if (
        loggedIn !== "true" ||
        !storedUser
    ) {

        alert(
            "Please login before writing."
        );

        window.location.href =
            "login.html";

    }

    else {

        const loggedUser =
            document.getElementById("loggedUser");

        if (loggedUser) {

            loggedUser.innerText =
                "Hi, " + storedUser.name;

        }

    }

}


// ================= LOGOUT =================


document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.id === "logoutBtn"
        ) {

            localStorage.removeItem(
                "dilsightLoggedIn"
            );

            localStorage.removeItem(
                "dilsightUser"
            );

            window.location.href =
                "login.html";

        }

    }
);


// ================= STORY PUBLISH =================
// ================= STORY PUBLISH =================

const storyForm =
    document.getElementById("storyForm");

if (storyForm) {

    // ================= EDIT MODE =================

    const editId =
        new URLSearchParams(
            window.location.search
        ).get("edit");


    if (editId) {

        supabaseClient
            .from("articles")
            .select("*")
            .eq("id", editId)
            .maybeSingle()
            .then(function (result) {

                const editArticle =
                    result.data;

                const editError =
                    result.error;

                if (editError) {

                    console.error(
                        "Edit article fetch error:",
                        editError
                    );

                    alert(
                        "Article could not be loaded: " +
                        editError.message
                    );

                    return;
                }

                if (!editArticle) {

                    alert(
                        "Article not found."
                    );

                    return;
                }

                document.getElementById(
                    "storyTitle"
                ).value =
                    editArticle.title;

                document.getElementById(
                    "storyCategory"
                ).value =
                    editArticle.category;

                document.getElementById(
                    "storyContent"
                ).value =
                    editArticle.content;

                const languageOption =
                    document.querySelector(
                        'input[name="language"][value="' +
                        editArticle.language +
                        '"]'
                    );

                if (languageOption) {

                    languageOption.checked =
                        true;

                }

            });


    }


    storyForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const title =
                document.getElementById(
                    "storyTitle"
                ).value.trim();


            const category =
                document.getElementById(
                    "storyCategory"
                ).value;


            const content =
                document.getElementById(
                    "storyContent"
                ).value.trim();


            const language =
                document.querySelector(
                    'input[name="language"]:checked'
                ).value;


            const imageInput =
                document.getElementById(
                    "storyImage"
                );


            const storedUser =
                JSON.parse(
                    localStorage.getItem(
                        "dilsightUser"
                    )
                );


            // ================= IMAGE =================

            (async function () {

                if (
                    imageInput.files &&
                    imageInput.files.length > 0
                ) {

                    const file = imageInput.files[0];

                    // 5 MB से बड़ी image न लो
                    if (file.size > 5 * 1024 * 1024) {
                        alert("Image 5 MB से छोटी होनी चाहिए.");
                        return;
                    }

                    const {
                        data: { user: imgUser }
                    } = await supabaseClient.auth.getUser();

                    if (!imgUser) {
                        alert("Please login again.");
                        window.location.href = "login.html";
                        return;
                    }

                    const ext =
                        (file.name.split(".").pop() || "jpg")
                            .toLowerCase();

                    const filePath =
                        imgUser.id + "/" + Date.now() + "." + ext;

                    const { error: uploadError } =
                        await supabaseClient.storage
                            .from("article-images")
                            .upload(filePath, file);

                    if (uploadError) {
                        console.error("Image upload error:", uploadError);
                        alert("Image upload failed: " + uploadError.message);
                        return;
                    }

                    const { data: publicData } =
                        supabaseClient.storage
                            .from("article-images")
                            .getPublicUrl(filePath);

                    saveArticle(publicData.publicUrl);

                } else {

                    saveArticle("");

                }

            })();




            // ================= SAVE ARTICLE =================

            // ================= SAVE / UPDATE ARTICLE =================

            async function saveArticle(
                imageData
            ) {

                let articles =
                    JSON.parse(
                        localStorage.getItem(
                            "dilsightArticles"
                        )
                    ) || [];


                // ================= EDIT ARTICLE =================

                if (editId) {

                    const publishArticleBtn =
                        document.getElementById("publishArticleBtn");

                    if (publishArticleBtn) {
                        publishArticleBtn.innerText = "Update Article";
                    }

                    const {
                        data: { user: editUser },
                        error: editUserError
                    } = await supabaseClient.auth.getUser();

                    if (editUserError || !editUser) {
                        alert("Please login again.");
                        window.location.href = "login.html";
                        return;
                    }

                    const updateData = {
                        title: title,
                        category: category,
                        language: language,
                        content: content
                    };

                    // नई image चुनी हो तभी image बदलेगी
                    if (imageData) {
                        updateData.image_url = imageData;
                    }

                    const {
                        data: updatedRows,
                        error: updateError
                    } = await supabaseClient
                        .from("articles")
                        .update(updateData)
                        .eq("id", editId)
                        .eq("author_id", editUser.id)
                        .select();

                    if (updateError) {
                        console.error("Article update error:", updateError);
                        alert("Update failed: " + updateError.message);
                        return;
                    }

                    if (!updatedRows || updatedRows.length === 0) {
                        alert(
                            "Article update नहीं हुआ. या तो ये आपका article नहीं है, या Supabase की policy update allow नहीं कर रही."
                        );
                        return;
                    }

                    // Local copy भी sync करो, ताकि article page पर नया content दिखे
                    const articleIndex =
                        articles.findIndex(function (item) {
                            return String(item.id) === String(editId);
                        });

                    if (articleIndex !== -1) {
                        articles[articleIndex].title = title;
                        articles[articleIndex].category = category;
                        articles[articleIndex].language = language;
                        articles[articleIndex].content = content;

                        if (imageData) {
                            articles[articleIndex].image = imageData;
                        }

                        localStorage.setItem(
                            "dilsightArticles",
                            JSON.stringify(articles)
                        );
                    }

                    alert("Your article has been updated!");

                    window.location.href =
                        "article.html?id=" + editId;

                    return;

                }


                // ================= NEW ARTICLE =================
                // ================= SUPABASE SAVE =================

                const {
                    data: { user },
                    error: userError
                } =
                    await supabaseClient.auth.getUser();


                if (
                    userError ||
                    !user
                ) {

                    alert(
                        "User authentication not found. Please login again."
                    );

                    return;

                }


                const { error: insertError } =
                    await supabaseClient
                        .from("articles")
                        .insert([
                            {

                                author_id:
                                    user.id,

                                title:
                                    title,

                                content:
                                    content,

                                category:
                                    category,

                                language:
                                    language,

                                image_url:
                                    imageData || "",

                                published:
                                    true

                            }
                        ]);


                if (insertError) {

                    console.error(
                        "Supabase article error:",
                        insertError
                    );


                    alert(
                        "Article could not be published: " +
                        insertError.message
                    );


                    return;

                }





                alert(
                    "Your article has been published!"
                );


                window.location.href =
                    "index.html";

            }

        }
    );

}


// ================= HOME WRITE BUTTON =================

const homeWriteButtons =
    document.querySelectorAll(
        ".write-btn, .write-story-btn:not(#editProfileBtn):not(#saveProfileBtn)"
    );


homeWriteButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const loggedIn =
                    localStorage.getItem(
                        "dilsightLoggedIn"
                    );


                if (
                    loggedIn === "true"
                ) {

                    window.location.href =
                        "write.html";

                }

                else {

                    window.location.href =
                        "login.html";

                }

            }
        );

    }
);


// ================= START READING =================

const startButton =
    document.querySelector(
        ".start-btn"
    );


if (startButton) {

    startButton.addEventListener(
        "click",
        function () {

            document
                .querySelector(
                    ".stories-section"
                )
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );

}
async function loadLatestStoriesFromSupabase() {


    const { data, error } =
        await supabaseClient
            .from("articles")
            .select("*, profiles(full_name, username)")
            .select("*")
            .eq("published", true)
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.error(
            "Supabase articles error:",
            error
        );
        return;
    }
    const formattedArticles = await Promise.all(
        data.map(
            async function (article) {

                const { data: profile } =
                    await supabaseClient
                        .from("profiles")
                        .select("full_name, username")
                        .eq("id", article.author_id)
                        .maybeSingle();

                return {
                    id: article.id,

                    author_id: article.author_id,

                    author_id: article.author_id,

                    title: article.title,

                    content: article.content,

                    category: article.category,

                    language: article.language,

                    image: article.image_url || "",

                    author:
                        profile?.full_name ||
                        profile?.username ||
                        article.author_id,

                    date:
                        new Date(
                            article.created_at
                        ).toLocaleDateString()
                };

            }
        )
    );

    localStorage.setItem(
        "dilsightArticles",
        JSON.stringify(formattedArticles)
    );

}
const articlesReady = loadLatestStoriesFromSupabase();
// ================= LATEST STORIES =================

const storyGrid =
    document.getElementById("storyGrid");

(async function () {
    await articlesReady;

    if (storyGrid) {

        const articles =
            JSON.parse(
                localStorage.getItem("dilsightArticles")
            ) || [];

        storyGrid.innerHTML = "";

        if (articles.length === 0) {

            storyGrid.innerHTML = `
            <div class="empty-stories">
                <h3>No stories published yet.</h3>
                <p>Be the first person to share a story on Dilsight.</p>

                <button
                    class="write-story-btn"
                    onclick="window.location.href='write.html'">
                    Write Your Story
                </button>
            </div>
        `;

        } else {

            articles.forEach(
                function (article) {

                    const card =
                        document.createElement("article");

                    card.className =
                        "story-card dynamic-story";

                    card.innerHTML = `
                    <div class="dynamic-story-image">

                        ${article.image
                            ? `
                                    <img
                                        src="${article.image}"
                                        alt="${escapeHTML(article.title)}"
                                    >
                                `
                            : ""
                        }

                        <div class="dynamic-category">
                            ${escapeHTML(article.category)}
                        </div>

                    </div>

                    <div class="story-content">

                        <h3>
                            ${escapeHTML(article.title)}
                        </h3>

                        <p>
                            ${escapeHTML(
                            article.content.substring(0, 120)
                        )}

                            ${article.content.length > 120
                            ? "..."
                            : ""
                        }
                        </p>

                        <div class="story-meta">

                            <span>
                                By ${escapeHTML(article.author)}
                            </span>

                            <span>
                                ${escapeHTML(article.language)}
                            </span>

                            <span class="heart like-btn">
                                ♡
                                <span class="like-count">0</span>
                            </span>

                        </div>

                    </div>
                `;

                    card.addEventListener(
                        "click",
                        function () {

                            window.location.href =
                                "article.html?id=" +
                                article.id;

                        }
                    );
                    // ================= SUPABASE LIKE SYSTEM =================

                    const likeButton =
                        card.querySelector(".like-btn");

                    const likeCount =
                        card.querySelector(".like-count");

                    async function loadLikeData() {

                        const {
                            count,
                            error
                        } =
                            await supabaseClient
                                .from("article_likes")
                                .select("id", {
                                    count: "exact",
                                    head: true
                                })
                                .eq(
                                    "article_id",
                                    article.id
                                );

                        if (error) {
                            console.error(
                                "Like count error:",
                                error
                            );
                            return;
                        }

                        likeCount.innerText =
                            count || 0;


                        const {
                            data: {
                                user
                            }
                        } =
                            await supabaseClient.auth.getUser();

                        if (!user) {
                            return;
                        }


                        const {
                            data: existingLike
                        } =
                            await supabaseClient
                                .from("article_likes")
                                .select("id")
                                .eq(
                                    "article_id",
                                    article.id
                                )
                                .eq(
                                    "user_id",
                                    user.id
                                )
                                .maybeSingle();


                        if (existingLike) {
                            likeButton.innerHTML =
                                '♥ <span class="like-count">' +
                                (count || 0) +
                                "</span>";
                        }
                    }


                    likeButton.addEventListener(
                        "click",
                        async function (event) {

                            event.stopPropagation();


                            const {
                                data: {
                                    user
                                }
                            } =
                                await supabaseClient.auth.getUser();


                            if (!user) {

                                alert(
                                    "Please login to like this story."
                                );

                                return;
                            }


                            const {
                                data: existingLike
                            } =
                                await supabaseClient
                                    .from("article_likes")
                                    .select("id")
                                    .eq(
                                        "article_id",
                                        article.id
                                    )
                                    .eq(
                                        "user_id",
                                        user.id
                                    )
                                    .maybeSingle();


                            if (existingLike) {

                                // UNLIKE

                                const {
                                    error
                                } =
                                    await supabaseClient
                                        .from("article_likes")
                                        .delete()
                                        .eq(
                                            "id",
                                            existingLike.id
                                        );


                                if (error) {

                                    console.error(
                                        "Unlike error:",
                                        error
                                    );

                                    return;
                                }

                            } else {

                                // LIKE

                                const {
                                    error
                                } =
                                    await supabaseClient
                                        .from("article_likes")
                                        .insert({
                                            article_id:
                                                article.id,
                                            user_id:
                                                user.id
                                        });


                                if (error) {

                                    console.error(
                                        "Like error:",
                                        error
                                    );

                                    return;
                                }
                            }


                            await loadLikeData();

                        }
                    );


                    loadLikeData();
                    storyGrid.appendChild(card);

                }
            );

        }

    }
})();
// =====================================================
// ARTICLE READING PAGE
// =====================================================

if (
    window.location.pathname.includes("article.html")

) {

    (async function () {
        await articlesReady;


        const articleId =
            new URLSearchParams(
                window.location.search
            ).get("id");


        const articles =
            JSON.parse(
                localStorage.getItem(
                    "dilsightArticles"
                )
            ) || [];


        const article =
            articles.find(
                function (item) {

                    return String(item.id) ===
                        String(articleId);

                }
            );


        if (!article) {

            document.getElementById(
                "articleTitle"
            ).innerText =
                "Article not found.";
            return;

        }

        else {

            document.getElementById(
                "articleCategory"
            ).innerText =
                article.category;


            document.getElementById(
                "articleTitle"
            ).innerText =
                article.title;


            document.getElementById(
                "articleAuthor"
            ).innerText =
                "By " + article.author;


            document.getElementById(
                "articleDate"
            ).innerText =
                article.date;


            document.getElementById(
                "articleLanguage"
            ).innerText =
                article.language;


            document.getElementById(
                "articleContent"
            ).innerText =
                article.content;


            const articleImage =
                document.getElementById(
                    "articleImage"
                );


            if (article.image) {

                articleImage.src =
                    article.image;

                articleImage.style.display =
                    "block";

            }

            else {

                articleImage.style.display =
                    "none";

            }


            document.title =
                article.title +
                " — Dilsight";


            // ================= ARTICLE VIEWS =================



            const articleViews =
                document.getElementById("articleViews");

            if (articleViews) {

                // एक browser session में एक article का view एक ही बार गिनो
                const viewedKey = "dilsightViewed_" + article.id;
                let alreadyViewed = false;

                try {
                    alreadyViewed = sessionStorage.getItem(viewedKey) === "1";
                } catch (e) { }

                let viewsNow = null;

                if (!alreadyViewed) {

                    const { data: newCount, error: viewError } =
                        await supabaseClient.rpc(
                            "increment_view",
                            { p_article_id: article.id }
                        );

                    if (viewError) {
                        console.error("View count error:", viewError);
                    } else {
                        viewsNow = newCount;
                        try {
                            sessionStorage.setItem(viewedKey, "1");
                        } catch (e) { }
                    }

                } else {

                    const { data: row } = await supabaseClient
                        .from("articles")
                        .select("view_count")
                        .eq("id", article.id)
                        .maybeSingle();

                    viewsNow = row ? row.view_count : null;
                }

                if (viewsNow !== null) {
                    articleViews.innerText =
                        "👁️ " +
                        viewsNow +
                        (viewsNow === 1 ? " View" : " Views");
                }
            }


            // ================= COMMENTS =================

            const commentInput =
                document.getElementById(
                    "commentInput"
                );

            const postCommentBtn =
                document.getElementById(
                    "postCommentBtn"
                );

            const commentsList =
                document.getElementById(
                    "commentsList"
                );


            if (
                commentInput &&
                postCommentBtn &&
                commentsList
            ) {

                const loadComments = async function () {

                    const {
                        data: supabaseComments,
                        error: commentsError
                    } = await supabaseClient
                        .from("article_comments")
                        .select("*")
                        .eq("article_id", article.id)
                        .order("created_at", {
                            ascending: true
                        });

                    if (commentsError) {

                        console.error(
                            "Supabase comments error:",
                            commentsError
                        );

                        return;
                    }

                    const userIds = [
                        ...new Set(
                            supabaseComments.map(
                                function (comment) {
                                    return comment.user_id;
                                }
                            )
                        )
                    ];

                    let profiles = [];

                    if (userIds.length > 0) {

                        const {
                            data: profileData
                        } = await supabaseClient
                            .from("profiles")
                            .select("id, full_name, username")
                            .in("id", userIds);

                        profiles = profileData || [];
                    }

                    const articleComments =
                        supabaseComments.map(
                            function (comment) {

                                const profile =
                                    profiles.find(
                                        function (item) {
                                            return item.id ===
                                                comment.user_id;
                                        }
                                    );

                                return {

                                    id: comment.id,

                                    user_id: comment.user_id,

                                    user:
                                        profile?.full_name ||
                                        profile?.username ||
                                        "User",

                                    text:
                                        comment.comment,

                                    date:
                                        new Date(
                                            comment.created_at
                                        ).toLocaleString(),

                                    replies: []

                                };

                            }
                        );
                    const {
                        data: {
                            user: authUser
                        }
                    } = await supabaseClient.auth.getUser();
                    const commentIds =
                        articleComments.map(function (comment) {
                            return comment.id;
                        });


                    // ===== REPLIES LOAD (Supabase) =====
                    let replyRows = [];

                    if (commentIds.length > 0) {

                        const {
                            data: replyData,
                            error: replyError
                        } = await supabaseClient
                            .from("comment_replies")
                            .select("*")
                            .in("comment_id", commentIds)
                            .order("created_at", { ascending: true });

                        if (replyError) {
                            console.error("Replies load error:", replyError);
                        } else {
                            replyRows = replyData || [];
                        }
                    }

                    const replyUserIds = [
                        ...new Set(
                            replyRows.map(function (r) {
                                return r.user_id;
                            })
                        )
                    ];

                    let replyProfiles = [];

                    if (replyUserIds.length > 0) {

                        const {
                            data: replyProfileData
                        } = await supabaseClient
                            .from("profiles")
                            .select("id, full_name, username")
                            .in("id", replyUserIds);

                        replyProfiles = replyProfileData || [];
                    }

                    articleComments.forEach(function (c) {

                        c.replies = replyRows
                            .filter(function (r) {
                                return r.comment_id === c.id;
                            })
                            .map(function (r) {

                                const p = replyProfiles.find(function (x) {
                                    return x.id === r.user_id;
                                });

                                return {
                                    id: r.id,
                                    user_id: r.user_id,
                                    user:
                                        p?.full_name ||
                                        p?.username ||
                                        "User",
                                    text: r.reply,
                                    date: new Date(
                                        r.created_at
                                    ).toLocaleString()
                                };
                            });
                    });
                    // ===== REPLIES LOAD END =====    

                    let commentLikeRows = [];

                    if (commentIds.length > 0) {

                        const {
                            data: likeData,
                            error: likeError
                        } = await supabaseClient
                            .from("comment_likes")
                            .select("comment_id, user_id")
                            .in("comment_id", commentIds);

                        if (likeError) {

                            console.error(
                                "Comment likes error:",
                                likeError
                            );

                        } else {

                            commentLikeRows =
                                likeData || [];

                        }
                    }

                    const commentLikeCounts = {};

                    commentLikeRows.forEach(function (like) {

                        commentLikeCounts[like.comment_id] =
                            (
                                commentLikeCounts[like.comment_id] || 0
                            ) + 1;

                    });

                    const likedCommentIds = new Set(
                        authUser
                            ? commentLikeRows
                                .filter(function (like) {
                                    return (
                                        like.user_id ===
                                        authUser.id
                                    );
                                })
                                .map(function (like) {
                                    return like.comment_id;
                                })
                            : []
                    );


                    const currentUser =
                        JSON.parse(
                            localStorage.getItem(
                                "dilsightUser"
                            )
                        );



                    commentsList.innerHTML =
                        "";


                    if (
                        articleComments.length === 0
                    ) {

                        commentsList.innerHTML =
                            "<p>No comments yet. Be the first to comment.</p>";

                        return;

                    }


                    articleComments.forEach(
                        function (comment) {

                            const commentId =
                                String(comment.id);


                            const isLiked =
                                likedCommentIds.has(commentId);


                            const repliesHTML =
                                (
                                    comment.replies ||
                                    []
                                )
                                    .map(
                                        function (r) {

                                            const canDeleteReply =
                                                authUser &&
                                                (
                                                    authUser.id ===
                                                    r.user_id ||
                                                    authUser.id ===
                                                    article.author_id
                                                );


                                            const canEditReply =
                                                authUser &&
                                                authUser.id ===
                                                r.user_id;


                                            return `

                            <div class="reply-item">

                                <strong>
                                    ${escapeHTML(r.user)}
                                </strong>

                                <p>
                                    ${escapeHTML(r.text)}
                                </p>

                                <small>
                                    ${escapeHTML(r.date)}
                                </small>

                                ${canDeleteReply
                                                    ? `
                                        <button
                                            type="button"
                                            class="delete-reply-btn"
                                            data-comment-id="${comment.id}"
                                            data-reply-id="${r.id}">
                                            Delete
                                        </button>
                                    `
                                                    : ""
                                                }

                                ${canEditReply
                                                    ? `
                                        <button
                                            type="button"
                                            class="edit-reply-btn"
                                            data-comment-id="${comment.id}"
                                            data-reply-id="${r.id}">
                                            Edit
                                        </button>
                                    `
                                                    : ""
                                                }

                            </div>

                        `;

                                        }
                                    )
                                    .join("");


                            const commentDiv =
                                document.createElement(
                                    "div"
                                );


                            commentDiv.className =
                                "comment-item";


                            commentDiv.innerHTML = `

                            <strong>
                                ${escapeHTML(comment.user)}
                            </strong>

                            <p>
                                ${escapeHTML(comment.text)}
                            </p>

                            <small>
                                ${escapeHTML(comment.date)}
                            </small>


                            ${authUser &&
                                    authUser.id ===
                                    comment.user_id
                                    ? `

                <button
                    type="button"
                    class="delete-comment-btn"
                    data-comment-id="${comment.id}">
                    Delete
                </button>

                ${authUser &&
                                        authUser.id ===
                                        comment.user_id
                                        ? `

            <button
                type="button"
                class="edit-comment-btn"
                data-comment-id="${comment.id}">
                Edit
            </button>

        `
                                        : ""
                                    }

            `
                                    : ""
                                }


    <div class="comment-actions">

        <button
            class="comment-like-btn"
            type="button">

            ${isLiked
                                    ? "♥"
                                    : "♡"
                                }

            <span class="comment-like-count">
            ${commentLikeCounts[commentId] || 0}
            </span>

        </button>


        <button
            class="comment-reply-btn"
            type="button">

            ↩ Reply

        </button>

    </div>


    <div class="replies">
        ${repliesHTML}
    </div>

                        `;


                            const deleteReplyButtons =
                                commentDiv.querySelectorAll(
                                    ".delete-reply-btn"
                                );


                            const deleteCommentButton =
                                commentDiv.querySelector(
                                    ".delete-comment-btn"
                                );


                            if (
                                deleteCommentButton
                            ) {

                                deleteCommentButton.addEventListener(
                                    "click",
                                    async function (event) {

                                        event.stopPropagation();


                                        const commentId =
                                            String(
                                                deleteCommentButton
                                                    .dataset
                                                    .commentId
                                            );


                                        const user =
                                            JSON.parse(
                                                localStorage.getItem(
                                                    "dilsightUser"
                                                )
                                            );


                                        if (!user) {

                                            alert(
                                                "Please login first."
                                            );

                                            return;

                                        }


                                        const canDelete =
                                            authUser &&
                                            authUser.id ===
                                            comment.user_id;


                                        if (!canDelete) {

                                            alert(
                                                "You are not allowed to delete this comment."
                                            );

                                            return;

                                        }


                                        if (
                                            !confirm(
                                                "Delete this comment?"
                                            )
                                        ) {

                                            return;

                                        }


                                        const {
                                            error: deleteError
                                        } = await supabaseClient
                                            .from("article_comments")
                                            .delete()
                                            .eq("id", commentId);

                                        if (deleteError) {

                                            console.error(
                                                "Comment delete error:",
                                                deleteError
                                            );

                                            alert(
                                                "Comment could not be deleted: " +
                                                deleteError.message
                                            );

                                            return;
                                        }

                                        await loadComments();




                                    }
                                );

                            }


                            // ---------- EDIT COMMENT ----------

                            const editCommentButton =
                                commentDiv.querySelector(
                                    ".edit-comment-btn"
                                );


                            if (
                                editCommentButton
                            ) {

                                editCommentButton.addEventListener(
                                    "click",
                                    async function (event) {

                                        event.stopPropagation();


                                        const commentId =
                                            String(
                                                editCommentButton
                                                    .dataset
                                                    .commentId
                                            );


                                        const user =
                                            JSON.parse(
                                                localStorage.getItem(
                                                    "dilsightUser"
                                                )
                                            );


                                        if (!user) {

                                            alert(
                                                "Please login first."
                                            );

                                            return;

                                        }


                                        if (
                                            !authUser ||
                                            authUser.id !==
                                            comment.user_id
                                        ) {

                                            alert(
                                                "You are not allowed to edit this comment."
                                            );

                                            return;

                                        }


                                        const newText =
                                            prompt(
                                                "Edit your comment:",
                                                comment.text
                                            );


                                        if (
                                            newText ===
                                            null
                                        ) {

                                            return;

                                        }


                                        const trimmedText =
                                            newText.trim();


                                        if (
                                            !trimmedText
                                        ) {

                                            alert(
                                                "Comment cannot be empty."
                                            );

                                            return;

                                        }


                                        const {
                                            error: updateError
                                        } = await supabaseClient
                                            .from("article_comments")
                                            .update({
                                                comment: trimmedText
                                            })
                                            .eq("id", commentId)
                                            .eq("user_id", authUser.id);

                                        if (updateError) {

                                            console.error(
                                                "Comment update error:",
                                                updateError
                                            );

                                            alert(
                                                "Comment could not be updated: " +
                                                updateError.message
                                            );

                                            return;
                                        }

                                        await loadComments();






                                    }
                                );

                            }


                            // ---------- DELETE REPLY ----------


                            deleteReplyButtons.forEach(
                                function (button) {

                                    button.addEventListener(
                                        "click",
                                        async function (event) {

                                            event.stopPropagation();

                                            if (!authUser) {
                                                alert("Please login first.");
                                                return;
                                            }

                                            if (!confirm("Delete this reply?")) {
                                                return;
                                            }

                                            const {
                                                data: deletedReply,
                                                error: replyDeleteError
                                            } = await supabaseClient
                                                .from("comment_replies")
                                                .delete()
                                                .eq("id", button.dataset.replyId)
                                                .select();

                                            if (replyDeleteError) {
                                                console.error(
                                                    "Reply delete error:",
                                                    replyDeleteError
                                                );
                                                alert(
                                                    "Reply could not be deleted: " +
                                                    replyDeleteError.message
                                                );
                                                return;
                                            }

                                            if (!deletedReply || deletedReply.length === 0) {
                                                alert(
                                                    "Reply delete नहीं हुई. Policy allow नहीं कर रही."
                                                );
                                                return;
                                            }

                                            await loadComments();
                                        }
                                    );
                                }
                            );



                            // ---------- EDIT REPLY ----------

                            const editReplyButtons =
                                commentDiv.querySelectorAll(
                                    ".edit-reply-btn"
                                );

                            editReplyButtons.forEach(
                                function (button) {

                                    button.addEventListener(
                                        "click",
                                        async function (event) {

                                            event.stopPropagation();

                                            if (!authUser) {
                                                alert("Please login first.");
                                                return;
                                            }

                                            const replyToEdit =
                                                (comment.replies || []).find(
                                                    function (r) {
                                                        return String(r.id) ===
                                                            String(button.dataset.replyId);
                                                    }
                                                );

                                            if (!replyToEdit) {
                                                return;
                                            }

                                            const newText =
                                                prompt(
                                                    "Edit your reply:",
                                                    replyToEdit.text
                                                );

                                            if (newText === null) {
                                                return;
                                            }

                                            const trimmedText = newText.trim();

                                            if (!trimmedText) {
                                                alert("Reply cannot be empty.");
                                                return;
                                            }

                                            const {
                                                data: updatedReply,
                                                error: replyUpdateError
                                            } = await supabaseClient
                                                .from("comment_replies")
                                                .update({ reply: trimmedText })
                                                .eq("id", button.dataset.replyId)
                                                .eq("user_id", authUser.id)
                                                .select();

                                            if (replyUpdateError) {
                                                console.error(
                                                    "Reply update error:",
                                                    replyUpdateError
                                                );
                                                alert(
                                                    "Reply could not be updated: " +
                                                    replyUpdateError.message
                                                );
                                                return;
                                            }

                                            if (!updatedReply || updatedReply.length === 0) {
                                                alert(
                                                    "Reply update नहीं हुई. Policy allow नहीं कर रही."
                                                );
                                                return;
                                            }

                                            await loadComments();
                                        }
                                    );
                                }
                            );













                            // ---------- LIKE ----------

                            commentDiv
                                .querySelector(
                                    ".comment-like-btn"
                                )
                                .addEventListener(
                                    "click",
                                    async function (event) {

                                        event.stopPropagation();


                                        const user =
                                            JSON.parse(
                                                localStorage.getItem(
                                                    "dilsightUser"
                                                )
                                            );


                                        if (
                                            localStorage.getItem(
                                                "dilsightLoggedIn"
                                            ) !== "true" ||
                                            !user
                                        ) {

                                            alert(
                                                "Please login to like a comment."
                                            );

                                            return;

                                        }

                                        const {
                                            data: existingLike,
                                            error: likeCheckError
                                        } = await supabaseClient
                                            .from("comment_likes")
                                            .select("id")
                                            .eq("comment_id", commentId)
                                            .eq("user_id", authUser.id)
                                            .maybeSingle();

                                        if (likeCheckError) {
                                            console.error(
                                                "Comment like check error:",
                                                likeCheckError
                                            );
                                            return;
                                        }

                                        if (existingLike) {

                                            const {
                                                error: unlikeError
                                            } = await supabaseClient
                                                .from("comment_likes")
                                                .delete()
                                                .eq("id", existingLike.id);

                                            if (unlikeError) {
                                                console.error(
                                                    "Comment unlike error:",
                                                    unlikeError
                                                );
                                                alert(
                                                    "Comment unlike failed: " +
                                                    unlikeError.message
                                                );
                                                return;
                                            }

                                        } else {

                                            const {
                                                error: likeError
                                            } = await supabaseClient
                                                .from("comment_likes")
                                                .insert({
                                                    comment_id: commentId,
                                                    user_id: authUser.id
                                                });

                                            if (likeError) {
                                                console.error(
                                                    "Comment like error:",
                                                    likeError
                                                );
                                                alert(
                                                    "Comment like failed: " +
                                                    likeError.message
                                                );
                                                return;
                                            }
                                        }

                                        await loadComments();


                                    }
                                );


                            // ---------- REPLY ----------

                            commentDiv
                                .querySelector(
                                    ".comment-reply-btn"
                                )
                                .addEventListener(
                                    "click",
                                    async function () {

                                        const user =
                                            JSON.parse(
                                                localStorage.getItem(
                                                    "dilsightUser"
                                                )
                                            );


                                        if (
                                            localStorage.getItem(
                                                "dilsightLoggedIn"
                                            ) !== "true" ||
                                            !user
                                        ) {

                                            alert(
                                                "Please login to reply."
                                            );

                                            return;

                                        }


                                        const replyText =
                                            prompt(
                                                "Write your reply:"
                                            );
                                        if (
                                            !replyText ||
                                            !replyText.trim()
                                        ) {
                                            return;
                                        }



                                        const {
                                            error: replyInsertError
                                        } = await supabaseClient
                                            .from("comment_replies")
                                            .insert({
                                                comment_id: comment.id,
                                                user_id: authUser.id,
                                                reply: replyText.trim()
                                            });

                                        if (replyInsertError) {
                                            console.error(
                                                "Reply insert error:",
                                                replyInsertError
                                            );
                                            alert(
                                                "Reply could not be posted: " +
                                                replyInsertError.message
                                            );
                                            return;
                                        }

                                        await loadComments();








                                    }
                                );


                            commentsList.appendChild(
                                commentDiv
                            );

                        }
                    );


                };


                // ---------- POST COMMENT ----------

                // ---------- POST COMMENT ----------

                postCommentBtn.addEventListener(
                    "click",
                    async function () {

                        const {
                            data: {
                                user
                            }
                        } =
                            await supabaseClient.auth.getUser();

                        if (!user) {

                            alert(
                                "Please login to comment."
                            );

                            return;
                        }

                        const text =
                            commentInput.value.trim();

                        if (!text) {

                            alert(
                                "Please write a comment."
                            );

                            return;
                        }

                        const {
                            error
                        } =
                            await supabaseClient
                                .from("article_comments")
                                .insert({
                                    article_id:
                                        article.id,

                                    user_id:
                                        user.id,

                                    comment:
                                        text
                                });

                        if (error) {

                            console.error(
                                "Comment insert error:",
                                error
                            );

                            alert(
                                "Comment could not be posted: " +
                                error.message
                            );

                            return;
                        }

                        commentInput.value = "";

                        alert(
                            "Comment posted successfully!"
                        );
                        await loadComments();

                    }
                );


                loadComments();

            }


        }


        // ================= EDIT ARTICLE =================

        const editArticleBtn =
            document.getElementById(
                "editArticleBtn"
            );


        const loggedInUser =
            JSON.parse(
                localStorage.getItem(
                    "dilsightUser"
                )
            );


        const isLoggedIn =
            localStorage.getItem(
                "dilsightLoggedIn"
            ) === "true";


        if (
            editArticleBtn &&
            isLoggedIn &&
            loggedInUser &&
            loggedInUser.id ===
            article.author_id
        ) {

            editArticleBtn.style.display =
                "inline-block";


            editArticleBtn.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "write.html?edit=" +
                        article.id;

                }
            );

        }


        // ================= DELETE ARTICLE =================

        const deleteArticleBtn =
            document.getElementById(
                "deleteArticleBtn"
            );


        if (
            deleteArticleBtn &&
            isLoggedIn &&
            loggedInUser &&
            loggedInUser.id ===
            article.author_id
        ) {

            deleteArticleBtn.style.display =
                "inline-block";


            deleteArticleBtn.addEventListener(
                "click",
                async function () {

                    const confirmDelete =
                        confirm(
                            "Are you sure you want to delete this article?"
                        );


                    if (!confirmDelete) {

                        return;

                    }


                    const {
                        data: { user: delUser }
                    } = await supabaseClient.auth.getUser();

                    if (!delUser) {
                        alert("Please login again.");
                        window.location.href = "login.html";
                        return;
                    }

                    const {
                        data: deletedRows,
                        error: deleteError
                    } = await supabaseClient
                        .from("articles")
                        .delete()
                        .eq("id", article.id)
                        .eq("author_id", delUser.id)
                        .select();

                    if (deleteError) {
                        console.error("Article delete error:", deleteError);
                        alert("Delete failed: " + deleteError.message);
                        return;
                    }

                    if (!deletedRows || deletedRows.length === 0) {
                        alert(
                            "Article delete नहीं हुआ. या तो ये आपका article नहीं है, या Supabase की policy delete allow नहीं कर रही."
                        );
                        return;
                    }

                    // Local copy से भी हटाओ
                    const updatedArticles =
                        articles.filter(function (item) {
                            return String(item.id) !== String(article.id);
                        });

                    localStorage.setItem(
                        "dilsightArticles",
                        JSON.stringify(updatedArticles)
                    );


                    alert(
                        "Your article has been deleted."
                    );


                    window.location.href =
                        "index.html";

                }
            );

        }


        // ================= SHARE ARTICLE =================

        const shareArticleBtn =
            document.getElementById(
                "shareArticleBtn"
            );


        if (shareArticleBtn) {

            shareArticleBtn.addEventListener(
                "click",
                async function () {

                    const shareData = {

                        title:
                            article.title,

                        text:
                            "Read this story on Dilsight",

                        url:
                            window.location.href

                    };


                    // Native sharing

                    if (navigator.share) {

                        try {

                            await navigator.share(
                                shareData
                            );

                        }

                        catch (error) {

                            if (
                                error.name !==
                                "AbortError"
                            ) {

                                alert(
                                    "Unable to share article."
                                );

                            }

                        }

                    }


                    // Copy link fallback

                    else {

                        try {

                            await navigator.clipboard.writeText(
                                window.location.href
                            );


                            alert(
                                "Article link copied!"
                            );

                        }

                        catch (error) {

                            alert(
                                "Unable to copy link."
                            );

                        }

                    }

                }
            );

        }

    })();

}


// ================= VIEW ALL STORIES =================

const viewAllStories =
    document.getElementById("viewAllStories");

if (viewAllStories) {

    viewAllStories.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            window.location.reload();

        }
    );

}


// ================= CATEGORY FILTER =================

const categoryLinks = {

    navPoetry:
        "Poetry",

    navMovie:
        "Movie",

    navTravel:
        "Travel",

    navSpirituality:
        "Spirituality",

    navEssays:
        "Personal Essays"

};


Object.keys(categoryLinks).forEach(
    function (id) {

        const link =
            document.getElementById(id);


        if (link) {

            link.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const selectedCategory =
                        categoryLinks[id];


                    const storyGrid =
                        document.getElementById(
                            "storyGrid"
                        );


                    if (!storyGrid)
                        return;


                    const articles =
                        JSON.parse(
                            localStorage.getItem("dilsightArticles")
                        ) || [];


                    const filteredArticles =
                        articles.filter(
                            function (article) {

                                return (
                                    article.category ===
                                    selectedCategory
                                );

                            }
                        );


                    storyGrid.innerHTML = "";


                    if (
                        filteredArticles.length ===
                        0
                    ) {

                        storyGrid.innerHTML = `

                    <div class="empty-stories">

                        <h3>
                            No stories in this category yet.
                        </h3>

                        <p>
                            Be the first to share a
                            ${selectedCategory}
                            story.
                        </p>

                    </div>

                `;

                        return;

                    }


                    filteredArticles.forEach(
                        function (article) {

                            const card =
                                document.createElement(
                                    "article"
                                );


                            card.className =
                                "story-card dynamic-story";


                            card.innerHTML = `

                    <div class="dynamic-story-image">

                        ${article.image

                                    ? `
                            <img
                                src="${article.image}"
                                alt="${escapeHTML(
                                        article.title
                                    )}"
                            >
                        `

                                    : ""
                                }

                        <div class="dynamic-category">

                            ${escapeHTML(
                                    article.category
                                )}

                        </div>

                    </div>


                    <div class="story-content">

                        <h3>

                            ${escapeHTML(
                                    article.title
                                )}

                        </h3>


                        <p>

                            ${escapeHTML(
                                    article.content.substring(
                                        0,
                                        120
                                    )
                                )}

                            ${article.content.length >
                                    120
                                    ? "..."
                                    : ""
                                }

                        </p>


                        <div class="story-meta">

                            <span>

                                By ${escapeHTML(
                                    article.author
                                )}

                            </span>


                            <span>

                                ${escapeHTML(
                                    article.language
                                )}

                            </span>

                        </div>

                    </div>

                `;


                            card.addEventListener(
                                "click",
                                function () {

                                    window.location.href =
                                        "article.html?id=" +
                                        article.id;

                                }
                            );


                            storyGrid.appendChild(
                                card
                            );

                        }
                    );


                    storyGrid.scrollIntoView({

                        behavior:
                            "smooth"

                    });

                }
            );

        }

    }
);


// ================= STORY SEARCH =================

const searchInput =
    document.querySelector(
        ".search-box input"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const searchTerm =
                searchInput.value
                    .trim()
                    .toLowerCase();


            const storyGrid =
                document.getElementById(
                    "storyGrid"
                );


            if (!storyGrid)
                return;


            const articles =
                JSON.parse(
                    localStorage.getItem(
                        "dilsightArticles"
                    )
                ) || [];


            if (!searchTerm) {

                window.location.reload();

                return;

            }


            const filteredArticles =
                articles.filter(
                    function (article) {

                        return (

                            article.title
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            article.author
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            article.category
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            article.content
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                        );

                    }
                );


            storyGrid.innerHTML = "";


            if (
                filteredArticles.length ===
                0
            ) {

                storyGrid.innerHTML = `

                <div class="empty-stories">

                    <h3>
                        No stories found.
                    </h3>

                    <p>
                        Try another title,
                        author, category or keyword.
                    </p>

                </div>

            `;

                return;

            }


            filteredArticles.forEach(
                function (article) {

                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "story-card dynamic-story";


                    card.innerHTML = `

                <div class="dynamic-story-image">

                    ${article.image

                            ? `
                        <img
                            src="${article.image}"
                            alt="${escapeHTML(
                                article.title
                            )}"
                        >
                    `

                            : ""
                        }

                    <div class="dynamic-category">

                        ${escapeHTML(
                            article.category
                        )}

                    </div>

                </div>


                <div class="story-content">

                    <h3>

                        ${escapeHTML(
                            article.title
                        )}

                    </h3>


                    <p>

                        ${escapeHTML(
                            article.content.substring(
                                0,
                                120
                            )
                        )}

                        ${article.content.length >
                            120
                            ? "..."
                            : ""
                        }

                    </p>


                    <div class="story-meta">

                        <span>

                            By ${escapeHTML(
                            article.author
                        )}

                        </span>


                        <span>

                            ${escapeHTML(
                            article.language
                        )}

                        </span>

                    </div>

                </div>

            `;


                    card.addEventListener(
                        "click",
                        function () {

                            window.location.href =
                                "article.html?id=" +
                                article.id;

                        }
                    );


                    storyGrid.appendChild(
                        card
                    );

                }
            );

        }
    );

}


// =====================================================
// BASIC HTML ESCAPE
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;

}


// ================= LANGUAGE BUTTONS =================

const englishBtn =
    document.getElementById(
        "englishBtn"
    );


const hindiBtn =
    document.getElementById(
        "hindiBtn"
    );


if (
    englishBtn &&
    hindiBtn
) {

    englishBtn.addEventListener(
        "click",
        function () {

            localStorage.setItem(
                "dilsightLanguage",
                "English"
            );


            englishBtn.classList.add(
                "active-language"
            );


            hindiBtn.classList.remove(
                "active-language"
            );


            changeWebsiteLanguage(
                "English"
            );

        }
    );


    hindiBtn.addEventListener(
        "click",
        function () {

            localStorage.setItem(
                "dilsightLanguage",
                "Hindi"
            );


            hindiBtn.classList.add(
                "active-language"
            );


            englishBtn.classList.remove(
                "active-language"
            );


            changeWebsiteLanguage(
                "Hindi"
            );

        }
    );

}


// ================= WEBSITE LANGUAGE =================

const translations = {

    English: {

        loginTitle: "Welcome Back",

        footerDescription:
            "Stories that touch the mind and heart.",

        viewAll:
            "View All →",

        latestStoriesTitle:
            "Latest Stories",


        heroTagline:
            "Stories that travel from the heart to the world...",


        heroDescription:
            "Poems. Movie thoughts. Travel tales. Spiritual reflections. Personal essays.",


        heroVoice:
            "In Hindi. In English. In your own voice.",


        startReading:
            "Start Reading →",


        writeTitle:
            "Share your thoughts, experiences and stories with the world.",


        writeDescription:
            "Write in Hindi or English. Be a part of a different kind of space.",


        writeStory:
            "✎ Write Your Story",


        navHome:
            "Home",

        navPoetry:
            "Poetry",

        navMovie:
            "Movie",

        navTravel:
            "Travel",

        navSpirituality:
            "Spirituality",

        navEssays:
            "Personal Essays"

    },


    Hindi: {

        loginTitle:
            "वापसी पर स्वागत है",

        footerDescription:
            "कहानियाँ जो मन से निकलकर दुनिया तक पहुँचें...",

        viewAll:
            "सभी देखें →",

        latestStoriesTitle:
            "नवीनतम कहानियाँ",


        heroTagline:
            "कहानियाँ जो मन से निकलकर दुनिया तक पहुँचें...",


        heroDescription:
            "कविताएँ। फ़िल्मों पर विचार। यात्रा की कहानियाँ। आध्यात्मिक विचार। व्यक्तिगत लेख।",


        heroVoice:
            "हिंदी में। अंग्रेज़ी में। अपनी आवाज़ में।",


        startReading:
            "पढ़ना शुरू करें →",


        writeTitle:
            "अपने विचार, अनुभव और कहानियाँ दुनिया के साथ साझा करें।",


        writeDescription:
            "हिंदी या अंग्रेज़ी में लिखें। एक अलग अंदाज़ का हिस्सा बनें।",


        writeStory:
            "✎ अपनी कहानी लिखें",


        navHome:
            "होम",

        navPoetry:
            "कविता",

        navMovie:
            "फ़िल्म",

        navTravel:
            "यात्रा",

        navSpirituality:
            "आध्यात्मिकता",

        navEssays:
            "व्यक्तिगत लेख"

    }

};


function changeWebsiteLanguage(language) {

    document.getElementById(
        "heroTagline"
    ).innerHTML =
        translations[language].heroTagline;


    document.getElementById(
        "heroDescription"
    ).innerHTML =
        translations[language].heroDescription;


    document.getElementById(
        "heroVoice"
    ).innerHTML =
        translations[language].heroVoice;


    document.getElementById(
        "startReadingBtn"
    ).innerHTML =
        translations[language].startReading;


    document.getElementById(
        "writeTitle"
    ).innerHTML =
        translations[language].writeTitle;


    document.getElementById(
        "writeDescription"
    ).innerHTML =
        translations[language].writeDescription;


    document.getElementById(
        "writeStoryBtn"
    ).innerHTML =
        translations[language].writeStory;


    document.getElementById(
        "navHome"
    ).innerHTML =
        translations[language].navHome;


    document.getElementById(
        "navPoetry"
    ).innerHTML =
        translations[language].navPoetry;


    document.getElementById(
        "navMovie"
    ).innerHTML =
        translations[language].navMovie;


    document.getElementById(
        "navTravel"
    ).innerHTML =
        translations[language].navTravel;


    document.getElementById(
        "navSpirituality"
    ).innerHTML =
        translations[language].navSpirituality;


    document.getElementById(
        "navEssays"
    ).innerHTML =
        translations[language].navEssays;


    document.getElementById(
        "latestStoriesTitle"
    ).innerHTML =
        translations[language].latestStoriesTitle;


    document.getElementById(
        "viewAllStories"
    ).innerHTML =
        translations[language].viewAll;


    document.getElementById(
        "footerDescription"
    ).innerHTML =
        translations[language].footerDescription;

}


// ================= REMEMBER LANGUAGE =================
// ================= LOGIN PAGE LANGUAGE =================

const loginTitle =
    document.getElementById(
        "loginTitle"
    );


if (loginTitle) {

    const savedLanguage =
        localStorage.getItem(
            "dilsightLanguage"
        ) || "Hindi";


    loginTitle.innerHTML =
        translations[
            savedLanguage
        ].loginTitle;

}


if (
    englishBtn &&
    hindiBtn
) {

    const savedLanguage =
        localStorage.getItem(
            "dilsightLanguage"
        ) || "Hindi";


    changeWebsiteLanguage(
        savedLanguage
    );


    if (
        savedLanguage ===
        "English"
    ) {

        englishBtn.classList.add(
            "active-language"
        );

        hindiBtn.classList.remove(
            "active-language"
        );

    }

    else {

        hindiBtn.classList.add(
            "active-language"
        );

        englishBtn.classList.remove(
            "active-language"
        );

    }

}
// ================= PROFILE PAGE =================

if (
    window.location.pathname.includes("profile.html")
) {

    async function loadProfile() {

        const {
            data: {
                user
            }
        } =
            await supabaseClient.auth.getUser();


        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        const {
            data: profile,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "full_name, username, bio, created_at"
                )
                .eq("id", user.id)
                .maybeSingle();


        if (error) {

            console.error(
                "Profile loading error:",
                error
            );

            return;

        }


        if (!profile) {

            return;

        }


        document.getElementById(
            "profileName"
        ).innerText =
            profile.full_name ||
            "User";


        document.getElementById(
            "profileUsername"
        ).innerText =
            profile.username
                ? "@" + profile.username
                : "";


        document.getElementById(
            "profileBio"
        ).innerText =
            profile.bio ||
            "No bio added yet.";


        document.getElementById(
            "profileInitial"
        ).innerText =
            (
                profile.full_name ||
                "U"
            )
                .charAt(0)
                .toUpperCase();


        if (profile.created_at) {

            document.getElementById(
                "joinDate"
            ).innerText =
                new Date(
                    profile.created_at
                ).toLocaleDateString();

        }


        const {
            count
        } =
            await supabaseClient
                .from("articles")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "author_id",
                    user.id
                );


        document.getElementById(
            "storyCount"
        ).innerText =
            count || 0;

    }


    loadProfile();
    // ================= EDIT PROFILE =================

    const editProfileBtn =
        document.getElementById("editProfileBtn");

    const editProfileForm =
        document.getElementById("editProfileForm");

    const saveProfileBtn =
        document.getElementById("saveProfileBtn");

    if (
        editProfileBtn &&
        editProfileForm &&
        saveProfileBtn
    ) {

        editProfileBtn.addEventListener(
            "click",
            async function () {

                const {
                    data: {
                        user
                    }
                } =
                    await supabaseClient.auth.getUser();

                if (!user) {
                    window.location.href =
                        "login.html";
                    return;
                }

                const {
                    data: profile
                } =
                    await supabaseClient
                        .from("profiles")
                        .select(
                            "full_name, username, bio"
                        )
                        .eq("id", user.id)
                        .maybeSingle();

                if (profile) {

                    document.getElementById(
                        "editFullName"
                    ).value =
                        profile.full_name || "";

                    document.getElementById(
                        "editUsername"
                    ).value =
                        profile.username || "";

                    document.getElementById(
                        "editBio"
                    ).value =
                        profile.bio || "";
                }

                editProfileForm.style.display =
                    "block";
            }
        );

        saveProfileBtn.addEventListener(
            "click",
            async function () {

                const {
                    data: {
                        user
                    }
                } =
                    await supabaseClient.auth.getUser();

                if (!user) {
                    window.location.href =
                        "login.html";
                    return;
                }

                const fullName =
                    document.getElementById(
                        "editFullName"
                    ).value.trim();

                const username =
                    document.getElementById(
                        "editUsername"
                    ).value.trim();

                const bio =
                    document.getElementById(
                        "editBio"
                    ).value.trim();

                const {
                    error
                } =
                    await supabaseClient
                        .from("profiles")
                        .update({
                            full_name:
                                fullName,
                            username:
                                username,
                            bio:
                                bio
                        })
                        .eq(
                            "id",
                            user.id
                        );

                if (error) {
                    console.error(
                        "Profile update error:",
                        error
                    );

                    alert(
                        "Profile update failed."
                    );

                    return;
                }

                alert(
                    "Profile updated successfully!"
                );

                window.location.reload();
            }
        );
    }

}
// ================= FORGOT PASSWORD =================

const forgotPasswordForm =
    document.getElementById(
        "forgotPasswordForm"
    );

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document.getElementById(
                    "resetEmail"
                ).value.trim();

            const resetMessage =
                document.getElementById(
                    "resetMessage"
                );


            const {
                error
            } =
                await supabaseClient.auth
                    .resetPasswordForEmail(
                        email,
                        {
                            redirectTo:
                                window.location.origin +
                                "/reset-password.html"
                        }
                    );


            if (error) {

                resetMessage.innerText =
                    error.message;

                return;

            }


            resetMessage.innerText =
                "Password reset link has been sent to your email.";

        }
    );

}
// ================= RESET PASSWORD =================

const resetPasswordForm =
    document.getElementById(
        "resetPasswordForm"
    );

if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const newPassword =
                document.getElementById(
                    "newPassword"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;

            const message =
                document.getElementById(
                    "resetPasswordMessage"
                );


            if (
                newPassword !==
                confirmPassword
            ) {

                message.innerText =
                    "Passwords do not match.";

                return;

            }


            const {
                error
            } =
                await supabaseClient.auth
                    .updateUser({
                        password: newPassword
                    });


            if (error) {

                message.innerText =
                    error.message;

                return;

            }


            message.innerText =
                "Password updated successfully!";


            setTimeout(
                function () {

                    window.location.href =
                        "login.html";

                },
                1500
            );

        }
    );

}

