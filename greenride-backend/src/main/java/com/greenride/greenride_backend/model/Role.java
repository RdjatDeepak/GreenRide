package com.greenride.greenride_backend.model;
import jakarta.persistence.*;
@Entity
@Table(name = " roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  Long Id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ERole name;

    //Default Constructor
    public Role(){}
    public  Role (ERole name){
        this.name=name;
    }

    public Long getId() {
        return Id;
    }

    public void setId(Long id) {
        Id = id;
    }

    public ERole getName() {
        return name;
    }

    public void setName(ERole name) {
        this.name = name;
    }
}