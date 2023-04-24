$(() => {
    const $priceFields = $("form input[name]");
    const fees = {
        "メルカリ": 0.1,
        "ラクマ": 0.066, // 0.06 * 1.1
        "ヤフオク 送料込": 0.088, // 0.08 * 1.1
        "ヤフオク 送料別": 0.088, // 0.08 * 1.1
        "PayPayフリマ": 0.05,
    };
    $priceFields.toArray().forEach(input => {
        const fee = fees[$(input).attr("name")];
        if (fee) {
            const $label = $(input).closest(".form-group").find("label");
            $label.text(`${$label.text()} (${fee})`);
        }
    });
    const toNumber = text => ((text || "") + "").replace(/−/g, "-").replace(/[^0-9\.\-]/g, "") * 1;
    const formatAllPrices = () => {
        $priceFields.toArray().forEach(priceField => {
            let formattedPrice = formatNumber(Math.round(toNumber($(priceField).val())));
            formattedPrice = formattedPrice.replace(/^[\+\-]0$/, "0");
            $(priceField).val(`¥${formattedPrice}`);
        });
    };
    $priceFields.toArray().forEach(input => $(input).val(localStorage.getItem($(input).attr("name"))));
    $priceFields.on("blur", function () {
        formatAllPrices();
        const $shippingChargeField = $priceFields.filter("[name='送料']");
        const shippingCharge = toNumber($shippingChargeField.val());
        const $baseInput = $(this).is($shippingChargeField) ? $priceFields.filter(`[name!='${$shippingChargeField.attr("name")}']:first`) : $(this);
        const fee = fees[$baseInput.attr("name")];
        const basePrice = toNumber($baseInput.val()) * (1 - fee) + ($baseInput.hasClass("送料別") ? shippingCharge : 0);
        Object.keys(fees).forEach(key => {
            const $priceField = $priceFields.filter(`[name='${key}']`);
            if ($priceField.hasClass("送料込")) {
                $priceField.val(basePrice / (1 - fees[key]));
            }
            if ($priceField.hasClass("送料別")) {
                $priceField.val((basePrice - shippingCharge) / (1 - fees[key]));
            }
        });
        formatAllPrices();
        $priceFields.toArray().forEach(input => localStorage.setItem($(input).attr("name"), $(input).val()));
    }).filter(":first").blur();
    $priceFields.on("focus", function () {
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
