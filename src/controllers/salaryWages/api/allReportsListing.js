const getAllReportsListing = async (req, res) => {
    try {
        const data = [
            { name: "PF Report" },
            { name: "VPF Report" },
            { name: "ESIC Report" },
            { name: "Bonus Report" },
            { name: "Advance Report" },
            { name: "Overtime Report" },
            { name: "Ptax Report" },
            { name: "Payable Report" },
            { name: "CTC Report" },
            
        ];

        res.status(200).send({
            status: true,
            message: 'success',
            // recordedPerPage: limit,
            // currentPage: pageNo, 
            totalData: data.length, 
            data: data
        })


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = {getAllReportsListing}

