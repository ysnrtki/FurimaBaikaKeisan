$(() => {
    const $priceFields = $("form input[name].price");
    const fees = {
        "メルカリ": 0.1,
        "ラクマ": 0.066, // 0.06 * 1.1
        "ヤフオク 送料込": 0.088, // 0.08 * 1.1
        "ヤフオク 送料別": 0.088, // 0.08 * 1.1
        "PayPayフリマ": 0.05,
        "Grailed": 0.17,
    };
    $priceFields.toArray().forEach(field => {
        const fee = fees[$(field).attr("name")];
        if (fee) {
            const $label = $(field).closest(".form-group").find("label");
            $label.text(`${$label.text()} (${fee})`);
        }
    });
    const toNumber = text => ((text || "") + "").replace(/−/g, "-").replace(/[^0-9\.\-]/g, "") * 1;
    const formatPriceFieldValue = $field => {
        let keta = $field.data("keta") * 1;
        keta = isNumber(keta) && keta >= 0 ? keta : 0;
        let formattedPrice = formatNumber(Math.round(toNumber($field.val()) * (keta > 0 ? 10 ** keta : 1)) / (keta > 0 ? 10 ** keta : 1), keta);
        formattedPrice = formattedPrice.replace(/^[\+\-]0$/, "0");
        formattedPrice = `${$field.hasClass("usd") ? "$" : "¥"}${formattedPrice}`;
        $field.val(formattedPrice);
    };
    $priceFields.toArray().forEach(input => $(input).val(localStorage.getItem($(input).attr("name"))));
    $priceFields.filter(":not([readonly],[disabled])").on("blur", function () {
        const $triggerElement = $(this);
        (() => {
            $.ajax(
                "https://queue.co.jp/cgi-bin/kawase.cgi",
                {
                    type: "get",
                    dataType: "json",
                    async: false,
                },
            )
            .done(js => {
                const usdjpy = js.quotes.find(quote => quote.currencyPairCode === "USDJPY");
                $("[name='USDJPY']").val((toNumber(usdjpy.bid) + toNumber(usdjpy.ask)) / 2);
            })
            .fail((jqXHR, textStatus, errorThrown) => {
                alert("USDJPYの取得に失敗しました。");
                console.error(jqXHR);
                console.error(textStatus);
                console.error(errorThrown);
            });
        })();
        $priceFields.toArray().forEach(priceField => formatPriceFieldValue($(priceField)));

        const $usdjpyField = $priceFields.filter("[name='USDJPY']");
        const usdjpy = toNumber($usdjpyField.val());

        $priceFields.filter(".usd").toArray().forEach(field => $(field).val(toNumber($(field).val()) * usdjpy));

        const $basePriceField = $priceFields.filter("[name='販売利益']");
        const $domesticShippingChargeField = $priceFields.filter("[name='国内送料']");
        const domesticShippingCharge = toNumber($domesticShippingChargeField.val());
        const $overseasShippingChargeField = $priceFields.filter("[name='海外送料']");
        const overseasShippingCharge = toNumber($overseasShippingChargeField.val());

        let basePrice = toNumber($basePriceField.val());
        if (Object.keys(fees).includes($triggerElement.attr("name"))) {
            const fee = fees[$triggerElement.attr("name")];
            basePrice = toNumber($triggerElement.val()) * (1 - fee);
            if ($triggerElement.hasClass("送料込")) {
                const shippingCharge = $triggerElement.is("[name='Grailed']") ? overseasShippingCharge : domesticShippingCharge;
                basePrice = toNumber($triggerElement.val()) * (1 - fee) - shippingCharge;
            }
            $basePriceField.val(basePrice);
        }
        Object.keys(fees).forEach(key => {
            const $priceField = $priceFields.filter(`[name='${key}']`);
            $priceField.val(basePrice / (1 - fees[key]));
            if ($priceField.hasClass("送料込")) {
                const shippingCharge = $priceField.is("[name='Grailed']") ? overseasShippingCharge : domesticShippingCharge;
                $priceField.val((basePrice + shippingCharge) / (1 - fees[key]));
            }
        });
        $priceFields.filter(".usd").toArray().forEach(field => $(field).val(toNumber($(field).val()) / usdjpy));
        $priceFields.toArray().forEach(priceField => formatPriceFieldValue($(priceField)));

        $priceFields.toArray().forEach(input => localStorage.setItem($(input).attr("name"), $(input).val()));
    }).filter(":first").blur();
    $priceFields.filter(":not([readonly],[disabled])").on("focus", function () {
        $(this).val(toNumber($(this).val()));
        this.select();
    });
});

const isNumber = value => typeof value === "number" && !isNaN(value);
const toInt = (value, defaultValue) => {
    const result = parseInt(value, 10);
    return isNaN(result) ? defaultValue : result;
};

const trimEx = value => {
    if (typeof value === "string") {
        return value.replace(/^[\s　]+|[\s　]+$/g, "");
    }
    return value;
};

const formatNumber = (value, minimumFractionDigits) => {
    if (!isNumber(value)) {
        return value + "";
    }
    if (isNumber(minimumFractionDigits)) {
        minimumFractionDigits2 = minimumFractionDigits;
    } else {
        minimumFractionDigits2 = /\.[0-9]+$/.test(value + "") ? 4 : 0;
    }
    return new Intl.NumberFormat("en", { style: "decimal", minimumFractionDigits: minimumFractionDigits2 }).format(value);
};