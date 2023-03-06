/// <reference path="jquery-3.6.0.js"/>
"use strict";

$(() => {
    let coins = [];
    const storedCoins = new Map();
    let toggledCoin = [];
    let chartCoins = [];
    let chartInterval;
    clearInterval(chartInterval);
    handleCoins();
    $("section").hide();
    $("#homeSection").show();

    $("a").on("click", function () {
        const dataSection = $(this).attr("data-section");
        $("section").hide();
        $("#" + dataSection).show();
        $("a").removeClass("activeNav");
        $(this).addClass("activeNav");
    });

    // coin information
    $("#homeSection").on("click", ".coin-card > button", async function () {
        const coinId = $(this).attr("id");
        const coin = await getMoreInfo(coinId);
        const loader = `<div><img id="loader_${coin.id}" class="load" $("#homeSection").html <img src="assets/images/loader.png" alt=""></div>`;
        if ($(this).next().hasClass("show") === false) {
            $(this).text("Show Less");
            $(this).next().addClass("show");
            $(this).parent().css("height", "225px");
            $(this).next().css("visibility", "visible");
        }
        else {
            $(this).text("More Info");
            $(this).parent().css("height", "160px");
            $(this).next().css("visibility", "hidden");
            $(this).next().fadeOut(500).removeClass("show");
        }
        if (storedCoins.has(coinId)) {
            let cachedCoin = storedCoins.get(coinId);
            getMoreInfoData(coinId, cachedCoin);
        }
        else {
            $(this).next().html(loader);
            $(`#loader_${coinId}`).css("visibility", "visible");
            setTimeout(function () {
                $(this).next().html("");
                let newCoin = coin.market_data.current_price;
                getMoreInfoData(coinId, newCoin);
                storedCoins.set(coinId, { ils: coin.market_data.current_price.ils, usd: coin.market_data.current_price.usd, eur: coin.market_data.current_price.eur });
                setTimeout(() => storedCoins.delete(coinId), 120000);
            }, 1000);
        }
    });


    // Price details
    function getMoreInfoData(coinId, cachedCoin) {
        $(`#${coinId}`).next().html(`
    <div class="moreInfoContainer">
    <span>ILS: ₪${cachedCoin.ils}</span>
    <span>USD: $${cachedCoin.usd}</span>
    <span>EUR: €${cachedCoin.eur}</span>
    </div>
    `).fadeIn(500);
    }


    // Delete coin
    function deleteCoin(coin) {
        const selectedCoins = toggledCoin;
        const index = toggledCoin.indexOf(coin);
        selectedCoins.splice(index, 1);
    }

    // Delete coin by symbol
    function deleteChartCoin(coin) {
        const selectedCoins = chartCoins;
        const index = chartCoins.indexOf(coin);
        selectedCoins.splice(index, 1);
    }


    // Toggle
    $("#homeSection").on("click", "i", async function () {
        const coinId = $(this).parent().attr("class");
        const coin = await getMoreInfo(coinId);
        const currencyId = coin.id;
        const coinSymbol = coin.symbol;
        const star = $(this).hasClass("fa-regular fa-star toggle");

        if (star === true) {
            $(this).removeClass("fa-regular fa-star toggle");
            $(this).addClass("fa-solid fa-star toggle").css("color", "green");
            if (toggledCoin.length < 5) {
                toggledCoin.push(currencyId);
                chartCoins.push(coinSymbol);
            }
            else {
                let content = "";
                for (let i = 0; i < toggledCoin.length; i++) {
                    let card = `<div id="modalDiv">
                    <div class="modal-card glass-effect" id="modalCard">
                    <div class="card-body" id="modalCardBody">
                                <div id="${chartCoins[i]}" class="${toggledCoin[i]}">
                                    <i class="fa-solid fa-star toggle"></i>
                                </div>
                                <h6 id="modalCoinName" class="card-title">${toggledCoin[i]}</h6>
                            </div>
                        </div>
                    </div>`;
                    content += card;
                }
                showModal(`More than 5 coins selected, to add ${coin.name} you must remove one coin: `, `${content}`, [
                    {
                        label: "Decline",
                        onClick: (modal) => {
                            toggledCoin.pop();
                            chartCoins.pop();
                            $(this).removeClass("fa-solid fa-star toggle");
                            $(this).addClass("fa-regular fa-star toggle").css("color", "rgba(255, 255, 255, 0.7)");
                        },
                        triggerClose: true
                    },
                ]);
                toggledCoin.push(currencyId);
                chartCoins.push(coinSymbol);
                return;
            }
        }
        else {
            deleteCoin(currencyId);
            deleteChartCoin(coinSymbol);
            $(this).removeClass("fa-solid fa-star toggle");
            $(this).addClass("fa-regular fa-star toggle").css("color", "white");
        }

        function showModal(titleHtml, contentHtml, buttons) {
            const modal = document.createElement("div");
            modal.classList.add("modal");
            modal.innerHTML = `
            <div class="modal__inner">
            <div class="modal__top">
                <div class="modal__title">${titleHtml}</div>
            </div>
            <div class="modal__content">${contentHtml}</div>
            <div class="modal__bottom"></div>
        </div >
            `;

            for (const button of buttons) {
                const element = document.createElement("button");
                element.setAttribute("type", "button");
                element.classList.add("modal__button");
                element.textContent = button.label;
                element.addEventListener("click", () => {
                    if (button.triggerClose) {
                        $(".modal").remove();
                    }
                    button.onClick(modal);
                });
                modal.querySelector(".modal__bottom").appendChild(element);
            }
            $("#homeSection").append(modal);

            $(".modal").on("click", "i", function () {
                const thisCoin = $(this).parent().attr("class");
                const chartCoin = $(this).parent().attr("id");
                $(this).parent().parent().parent().parent().parent().parent().parent().parent().find(`.${thisCoin}`).children().removeClass("fa-solid fa-star toggle").addClass("fa-regular fa-star toggle").css("color", "rgba(255, 255, 255, 0.7)");

                if (star === true) {
                    $(this).removeClass("fa-solid fa-star toggle");
                    $(this).addClass("fa-regular fa-star toggle").css("color", "rgba(255, 255, 255, 0.7)");
                    deleteCoin(thisCoin);
                    deleteChartCoin(chartCoin);
                }
                $(".modal").remove();
            });
        }
    });


    // SearchBox
    $("#homeSection").on("keyup", "input[type=search]", function () {
        const textToSearch = $(this).val().toLowerCase();
        if (textToSearch === "") {
            displaySearchedCoins(coins);
        }
        else {
            const filteredCoins = coins.filter(c => c.symbol.indexOf(textToSearch) >= 0);
            if (filteredCoins.length > 0) {
                displaySearchedCoins(filteredCoins);
            }
            else {
                $("#shownCoins").html("Try again").css("margin-top", "10px");
            }
        }
    });


    // Getting coins from server
    async function handleCoins() {
        try {
            coins = await getJSON("https://api.coingecko.com/api/v3/coins");
            displayCoins(coins);
        }
        catch {
            const err = new Error("Failed");
            alert(err.message);
        }
    }

    // Display searched coins on page
    function displaySearchedCoins(coins) {
        let content = "";
        for (const coin of coins) {
            const card = createCard(coin);
            content += card;
        }
        $("#shownCoins").hide().html(content).fadeIn(1000);
    }

    // Displaying coins on page
    function displayCoins(coins) {
        const header = `<div><h1 id="mainHeader">Crypto Currency</h1></div>`;
        const search = `<div>
            <label for="searchBox">Search:</label>
            <input type="search" name="" id="searchBox" placeholder="Search by Symbol">
        </div>`;
        let content = "";
        for (const coin of coins) {
            const card = createCard(coin);
            content += card;
        }
        $("#homeSection").hide().html(header + search + `<div id=shownCoins> ${content}</div>`).fadeIn(1000);
    }


    // Create card
    function createCard(coin) {
        const card = `
        <div class="coin-card glass-effect" style="width: 500px;">
        <div id=coinIdDiv  class=${coin.id}>
            <i class="fa-regular fa-star toggle"></i>
        </div>
        <div id= symbolDiv>Symbol: ${coin.symbol}</div>
        <div id= coinNameDiv>Name: ${coin.name}</div>
        <div><img src="${coin.image.thumb}" /></div>
        <button id="${coin.id}" class="moreInfoBtn">More Information</button>
        <div></div>
        </div>`;
        return card;
    }

    // Get more info about coin
    async function getMoreInfo(coinId) {
        const coin = await getJSON("https://api.coingecko.com/api/v3/coins/" + coinId);
        return coin;
    }

    // Getting JSON from url
    function getJSON(url) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url,
                success: data => {
                    resolve(data);
                },
                complete: () => {
                    $(".loader").hide();
                },
                error: err => {
                    reject(err);
                }
            });
        });
    };


    // Home Section
    $("a[data-section='homeSection']").on("click", function () {
        clearInterval(chartInterval);
    });

    // About information
    $("a[data-section='aboutSection']").on("click", function () {
        clearInterval(chartInterval);
        const about = `<div id="mainContainer">
        <h2>By Ilay Amit</h2> 
        <div id="allInfo"> 
        <p> - Pardes hanna - 21 </p>
        <p> - Skills: HTML - CSS - JavaScript - jQuery - TypeScript </p>
        <p> - John Bryce Student - Full-Stack Developer </p>
        </div>
        <div><img src="assets/images/me1.jpeg" style="width: 400px" ></div>
        </div>`;
        $("#aboutSection").html(about);
    })

   

    // Live Reports
    $("#liveReportSection").append("<div id='chartContainer'> </div>");

    $("a[data-section='liveReportSection']").on("click", function () {
        $("#chartContainer").html("");
        let dataPoints1 = [];
        let dataPoints2 = [];
        let dataPoints3 = [];
        let dataPoints4 = [];
        let dataPoints5 = [];
        let coinKeys = [];

        // No selected coins alert
        if (chartCoins.length === 0) {
            $("#chartContainer").html("select coin for Live Reports.");
            return;
        }

        chartInterval = setInterval(() => {
            getDataFromAPI();
        }, 2000);

        // Getting data from API
        function getDataFromAPI() {
            let url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${chartCoins[0]},${chartCoins[1]},${chartCoins[2]},${chartCoins[3]},${chartCoins[4]}&tsyms=USD`;

            $.get(url).then(result => {
                let currentTime = new Date();
                let coinCounter = 1;

                for (let key in result) {
                    if (coinCounter == 1) {
                        dataPoints1.push({ x: currentTime, y: result[key].USD });
                        coinKeys.push(key);
                    }

                    if (coinCounter == 2) {
                        dataPoints2.push({ x: currentTime, y: result[key].USD });
                        coinKeys.push(key);
                    }

                    if (coinCounter == 3) {
                        dataPoints3.push({ x: currentTime, y: result[key].USD });
                        coinKeys.push(key);
                    }

                    if (coinCounter == 4) {
                        dataPoints4.push({ x: currentTime, y: result[key].USD });
                        coinKeys.push(key);
                    }

                    if (coinCounter == 5) {
                        dataPoints5.push({ x: currentTime, y: result[key].USD });
                        coinKeys.push(key);
                    }
                    coinCounter++;
                }
                createChart();
            })
        }

        // Create chart
        function createChart() {
            let options = {
                animationEnabled: false,
                backgroundColor: "white",
                title: {
                text: "Crypto Currency"},
                axisX: {
                    ValueFormatString: "HH: mm: ss",
                    titleFontColor: "black",
                    lineColor: "black",
                    labelFontColor: "black",
                    tickColor: "red"
                },
                axisY: {
                    suffix: "$",
                    titleFontColor: "black",
                    lineColor: "black",
                    labelFontColor: "black",
                    tickColor: "blue"
                },
                tooltip: {
                    shared: true
                },
                data: [{
                    type: "spline",
                    name: coinKeys[0],
                    showInLegend: true,
                    markerType: "square",
                    xValueFormatString: "HH: mm: ss",
                    dataPoints: dataPoints1
                },
                {
                    type: "spline",
                    name: coinKeys[1],
                    showInLegend: true,
                    markerType: "square",
                    xValueFormatString: "HH: mm: ss",
                    dataPoints: dataPoints2
                },
                {
                    type: "spline",
                    name: coinKeys[2],
                    showInLegend: true,
                    markerType: "square",
                    xValueFormatString: "HH: mm: ss",
                    dataPoints: dataPoints3
                },
                {
                    type: "spline",
                    name: coinKeys[3],
                    showInLegend: true,
                    markerType: "square",
                    xValueFormatString: "HH: mm: ss",
                    dataPoints: dataPoints4
                },
                {
                    type: "spline",
                    name: coinKeys[4],
                    showInLegend: true,
                    markerType: "square",
                    xValueFormatString: "HH: mm: ss",
                    dataPoints: dataPoints5
                }]
            }
            $("#chartContainer").CanvasJSChart(options);
            $("#chartContainer").append(options);
        }
    })
});
